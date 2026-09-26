import { describe, expect, it } from "vitest";

import {
  autonomies,
  compose,
  defaultSpec,
  describeSpec,
  providerById,
  suggestTopicId,
  tools,
  type Spec,
} from "@/lib/blueprint";
import { requestTypeById } from "@/lib/catalog";

/**
 * `compose()` — kurucunun saf hesap katmanı.
 * Burada önemli olan rakamların kendisi değil *sıralamaları ve sınırları*:
 * risk monotom artmalı, kapılar doğru açılmalı, tahmin kademe kümesine düşmeli.
 */

const spec = (over: Partial<Spec>): Spec => ({ ...defaultSpec, ...over });
const layer = (name: string) => compose(defaultSpec).layers.find((entry) => entry.name === name);

describe("compose · risk", () => {
  it("risk 0–100 arasında kalır (tüm riskli seçimler bir arada)", () => {
    const max = compose(
      spec({
        providerId: "openai",
        toolIds: tools.map((tool) => tool.id),
        autonomyId: "suru",
        evalId: "yok",
      }),
    );
    const min = compose(spec({ providerId: "local", toolIds: [], autonomyId: "oneri", evalId: "ci" }));

    expect(max.risk).toBeLessThanOrEqual(100);
    expect(min.risk).toBeGreaterThanOrEqual(0);
  });

  it("otonomi kademesi arttıkça risk monotom artar", () => {
    const risks = autonomies.map((autonomy) => compose(spec({ autonomyId: autonomy.id })).risk);
    for (let i = 1; i < risks.length; i += 1) {
      expect(risks[i] ?? 0).toBeGreaterThan(risks[i - 1] ?? 0);
    }
  });

  it("yazma aracı riski yükseltir; ölçme ciddiyeti riski düşürür", () => {
    const base = compose(spec({ toolIds: [] })).risk;
    // defaultSpec.evalId zaten "altin" → kıyas için evalId açıkça verilmeli.
    const writeNoMeasurement = compose(spec({ toolIds: ["write"], evalId: "yok" })).risk;
    const writeGoldSet = compose(spec({ toolIds: ["write"], evalId: "altin" })).risk;
    const writeCiGate = compose(spec({ toolIds: ["write"], evalId: "ci" })).risk;

    expect(writeGoldSet).toBeGreaterThan(base);
    expect(writeNoMeasurement).toBeGreaterThan(writeGoldSet);
    expect(writeCiGate).toBeLessThan(writeGoldSet);
  });

  it("risk bandı, risk sayısı ile tutarlı eşikleri kullanır", () => {
    for (const autonomy of autonomies) {
      for (const evalId of ["yok", "altin", "ci"] as const) {
        const composed = compose(spec({ autonomyId: autonomy.id, evalId }));
        const expected =
          composed.risk <= 28 ? "Düşük" : composed.risk <= 55 ? "Orta" : "Yüksek";
        expect(composed.band.label).toBe(expected);
      }
    }
  });

  it("bulut yerine yerel sağlayıcı kilitlenme riskini düşürür", () => {
    const cloud = compose(spec({ providerId: "anthropic" })).risk;
    const local = compose(spec({ providerId: "local" })).risk;
    expect(local).toBeLessThan(cloud);
  });
});

describe("compose · katman sahipliği", () => {
  it("bulut sağlayıcıda model katmanı kiralık, yerelde içeride", () => {
    expect(compose(spec({ providerId: "openai" })).layers[0]?.owner).toBe("kiralık");
    expect(compose(spec({ providerId: "local" })).layers[0]?.owner).toBe("içeride");
  });

  it("ölçme yoksa değerlendirme katmanı kiralıktır", () => {
    expect(
      compose(spec({ evalId: "yok" })).layers.find((entry) => entry.name === "Değerlendirme")?.owner,
    ).toBe("kiralık");
    expect(
      compose(spec({ evalId: "altin" })).layers.find((entry) => entry.name === "Değerlendirme")?.owner,
    ).toBe("içeride");
  });

  it("altı katman vardır ve sahiplik yüzdesi katmanlarla tutarlıdır", () => {
    const composed = compose(defaultSpec);
    expect(composed.layers).toHaveLength(6);
    const owned = composed.layers.filter((entry) => entry.owner === "içeride").length;
    expect(composed.ownedShare).toBe(Math.round((owned / 6) * 100));
  });

  it("riskli araç seçiliyse kontrol kapısı içeridedir; salt-okunur araçta kiralık kalır", () => {
    // Varsayılan spec `api` (risk 12) seçer → kapı içeride olmalı.
    expect(layer("Kontrol kapıları")?.owner).toBe("içeride");
    // Yalnız web araması (risk 6) kalırsa kapıya gerek yoktur.
    expect(
      compose(spec({ toolIds: ["web"] })).layers.find((entry) => entry.name === "Kontrol kapıları")?.owner,
    ).toBe("kiralık");
  });
});

describe("compose · şema ve çıktılar", () => {
  it("onay kapısı yalnızca riskli araçta veya otonomi ≥ 1 ike aktif olur", () => {
    expect(compose(spec({ autonomyId: "oneri", toolIds: ["web"] })).activeNodes.has("kapi")).toBe(false);
    expect(compose(spec({ autonomyId: "oneri", toolIds: ["write"] })).activeNodes.has("kapi")).toBe(true);
    expect(compose(spec({ autonomyId: "yari", toolIds: ["web"] })).activeNodes.has("kapi")).toBe(true);
  });

  it("çok ajanlı seçim yöneticiyi, otonom döngü gözlemciyi açar", () => {
    expect(compose(spec({ autonomyId: "suru" })).activeNodes.has("yonetici")).toBe(true);
    expect(compose(spec({ autonomyId: "otonom" })).activeNodes.has("gozlemci")).toBe(true);
    expect(compose(spec({ autonomyId: "yari" })).activeNodes.has("gozlemci")).toBe(false);
  });

  it("ana akış düğümleri her zaman aktiftir", () => {
    const nodes = compose(spec({ toolIds: [] })).activeNodes;
    for (const id of ["girdi", "baglam", "model", "arac", "iz"]) {
      expect(nodes.has(id)).toBe(true);
    }
  });

  it("oturum tahmini kademe kümesine yuvarlanır ve karmaşıklıkla artar", () => {
    const steps = [60, 90, 120, 180, 240] as const;
    const simple = compose(spec({ autonomyId: "oneri", toolIds: [] }));
    const complex = compose(spec({ toolIds: tools.map((tool) => tool.id), autonomyId: "suru" }));

    expect(steps).toContain(simple.estimateMinutes);
    expect(steps).toContain(complex.estimateMinutes);
    expect(complex.estimateMinutes).toBe(240);
    expect(complex.estimateMinutes).toBeGreaterThan(simple.estimateMinutes);
  });

  it("notlar ve kontrol listesi seçimden üretilir, liste 12 maddeyi geçmez", () => {
    const composed = compose(spec({ providerId: "google", toolIds: ["data", "code", "web"] }));
    expect(composed.notes[0]).toContain("Google");
    expect(composed.notes.join("\n")).toContain("Veriye erişim");
    expect(composed.checklist.length).toBeGreaterThan(3);
    expect(composed.checklist.length).toBeLessThanOrEqual(12);
    expect(new Set(composed.checklist).size).toBe(composed.checklist.length);
  });

  it("bilinmeyen sağlayıcı/model id'leri çökmez, güvenli varsayılana düşer", () => {
    expect(providerById("yok-boyle-bir-saglayici").id).toBe("anthropic");
    const composed = compose(spec({ providerId: "yok", modelId: "yok-model" }));
    expect(composed.provider.id).toBe("anthropic");
    expect(composed.model.name).toBeTruthy();
  });

  it("maliyet endeksi 1–14 arasındadır", () => {
    const min = compose(spec({ modelId: "hizli", toolIds: [], autonomyId: "oneri", evalId: "ci" }));
    const max = compose(
      spec({ modelId: "amiral", toolIds: tools.map((tool) => tool.id), autonomyId: "suru" }),
    );
    expect(min.costIndex).toBeGreaterThanOrEqual(1);
    expect(max.costIndex).toBeLessThanOrEqual(14);
    expect(max.costIndex).toBeGreaterThan(min.costIndex);
  });

  it("saf fonksiyondur: aynı girdi aynı çıktıyı verir", () => {
    expect(compose(defaultSpec)).toEqual(compose(defaultSpec));
  });
});

describe("kurucu → rezervasyon köprüsü", () => {
  it("seçilen araca göre doğru eğitim modülünü önerir", () => {
    expect(suggestTopicId(spec({ toolIds: ["data"] }))).toBe("m4-hafiza-baglam");
    expect(suggestTopicId(spec({ toolIds: ["code"] }))).toBe("m3-arac-tasarimi");
    expect(suggestTopicId(spec({ toolIds: ["write"] }))).toBe("m5-kontrol-guvenlik");
    expect(suggestTopicId(spec({ toolIds: [] }))).toBe("m1-anatomi");
    expect(suggestTopicId(spec({ autonomyId: "suru", toolIds: [] }))).toBe("m6-degerlendirme");
  });

  it("önerilen modüller gerçekten eğitim kataloğunda vardır", () => {
    const training = requestTypeById("destek-egitim");
    expect(training).toBeDefined();
    for (const tool of tools) {
      const id = suggestTopicId(spec({ toolIds: [tool.id] }));
      expect(training?.topics.some((topic) => topic.id === id)).toBe(true);
    }
  });

  it("mimari özeti sağlayıcı, model ve otonomiyi içerir", () => {
    const summary = describeSpec(compose(spec({ providerId: "anthropic", toolIds: ["data"] })));
    expect(summary).toContain("Anthropic");
    expect(summary).toContain("Yarı-otonom");
    expect(summary).toContain("Veriye erişim");
  });
});
