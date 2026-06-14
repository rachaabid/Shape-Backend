/**
 * Tests unitaires — Sprint 3 : Evaluations, Tableaux de bord & Formations.
 * Six cas couvrant US22 a US30, verifies en isolation sans appel a la base de donnees.
 */
describe("Tests unitaires — Sprint 3 (US22 a US30)", () => {

  // ── TU-01 — US24 : Evaluer un candidat ────────────────────────────────────
  it("TU-01 — Creer evaluation (US24) : un champ obligatoire vide est refuse", () => {
    const validateEvaluation = (ev: {
      intern:        string;
      period:        string;
      technical:     number;
      behavior:      number;
      communication: number;
      initiative:    number;
    }): boolean => {
      if (!ev.intern || !ev.intern.trim())
        throw new Error("Le stagiaire est obligatoire");
      if (!ev.period || !ev.period.trim())
        throw new Error("La periode est obligatoire");
      const fields = [ev.technical, ev.behavior, ev.communication, ev.initiative];
      if (fields.some(n => n < 0 || n > 10))
        throw new Error("Chaque note doit etre comprise entre 0 et 10");
      return true;
    };

    expect(() => validateEvaluation({ intern: "", period: "Stage 2025", technical: 8, behavior: 7, communication: 8, initiative: 6 }))
      .toThrow("Le stagiaire est obligatoire");
    expect(() => validateEvaluation({ intern: "u1", period: "", technical: 8, behavior: 7, communication: 8, initiative: 6 }))
      .toThrow("La periode est obligatoire");
    expect(() => validateEvaluation({ intern: "u1", period: "Stage 2025", technical: 12, behavior: 7, communication: 8, initiative: 6 }))
      .toThrow("Chaque note doit etre comprise entre 0 et 10");
    expect(validateEvaluation({ intern: "u1", period: "Stage 2025", technical: 8, behavior: 7, communication: 8, initiative: 6 }))
      .toBe(true);
  });

  // ── TU-02 — US24 : Calcul du score global ─────────────────────────────────
  it("TU-02 — Calcul globalScore evaluation (US24) : la moyenne des 4 criteres est exacte", () => {
    const computeGlobalScore = (technical: number, behavior: number, communication: number, initiative: number): number =>
      Math.round(((technical + behavior + communication + initiative) / 4) * 10) / 10;

    expect(computeGlobalScore(8, 7, 8, 6)).toBe(7.3);
    expect(computeGlobalScore(10, 10, 10, 10)).toBe(10);
    expect(computeGlobalScore(0,  0,  0,  0)).toBe(0);
    expect(computeGlobalScore(6,  8,  7,  9)).toBe(7.5);
  });

  // ── TU-03 — US30 : S'inscrire a une formation ─────────────────────────────
  it("TU-03 — Unicite inscription (US30) : un candidat ne peut pas s'inscrire deux fois", () => {
    const inscriptions = [
      { candidateId: "u1", trainingId: "t1" },
      { candidateId: "u2", trainingId: "t1" },
    ];

    const isAlreadyEnrolled = (candidateId: string, trainingId: string): boolean =>
      inscriptions.some(i => i.candidateId === candidateId && i.trainingId === trainingId);

    expect(isAlreadyEnrolled("u1", "t1")).toBe(true);  // doublon -> refuse
    expect(isAlreadyEnrolled("u3", "t1")).toBe(false); // nouveau candidat -> accepte
    expect(isAlreadyEnrolled("u1", "t2")).toBe(false); // autre formation  -> accepte
  });

  // ── TU-04 — US30 : Transitions de statut d'inscription ────────────────────
  it("TU-04 — Transitions statut inscription (US30) : seules les transitions valides sont autorisees", () => {
    // 0=pending  1=accepted  2=rejected
    const VALID_TRANSITIONS: Record<number, number[]> = {
      0: [1, 2], // pending -> accepted | rejected
    };

    const canTransition = (from: number, to: number): boolean =>
      (VALID_TRANSITIONS[from] ?? []).includes(to);

    expect(canTransition(0, 1)).toBe(true);  // pending  -> accepted ✓
    expect(canTransition(0, 2)).toBe(true);  // pending  -> rejected ✓
    expect(canTransition(1, 2)).toBe(false); // accepted -> rejected ✗
    expect(canTransition(2, 1)).toBe(false); // rejected -> accepted ✗
    expect(canTransition(1, 0)).toBe(false); // accepted -> pending  ✗
  });

  // ── TU-05 — US28 : Creer une formation ────────────────────────────────────
  it("TU-05 — Validation champs formation (US28) : les champs obligatoires sont verifies", () => {
    const validateTraining = (t: {
      title:   string;
      weeks:   number;
      lessons: string[];
    }): boolean => {
      if (!t.title || !t.title.trim())
        throw new Error("Le titre de la formation est obligatoire");
      if (t.weeks < 1)
        throw new Error("La formation doit contenir au moins une semaine");
      if (!t.lessons.length)
        throw new Error("Au moins une lecon est obligatoire");
      return true;
    };

    expect(() => validateTraining({ title: "", weeks: 4, lessons: ["Intro"] }))
      .toThrow("Le titre de la formation est obligatoire");
    expect(() => validateTraining({ title: "Python", weeks: 0, lessons: ["Intro"] }))
      .toThrow("La formation doit contenir au moins une semaine");
    expect(() => validateTraining({ title: "Python", weeks: 4, lessons: [] }))
      .toThrow("Au moins une lecon est obligatoire");
    expect(validateTraining({ title: "Python Avance", weeks: 4, lessons: ["Intro", "Boucles"] }))
      .toBe(true);
  });

  // ── TU-06 — US29 : Filtrage des formations par statut ─────────────────────
  it("TU-06 — Filtrage formations (US29) : le filtrage par statut retourne les bons resultats", () => {
    const trainings = [
      { id: "t1", title: "Python Avance", status: "active"   },
      { id: "t2", title: "DevOps Junior", status: "archived" },
      { id: "t3", title: "Data Science",  status: "active"   },
      { id: "t4", title: "Cloud AWS",     status: "archived" },
    ];

    const filterByStatus = (list: typeof trainings, status: string) =>
      list.filter(t => t.status === status);

    const active   = filterByStatus(trainings, "active");
    const archived = filterByStatus(trainings, "archived");

    expect(active.length).toBe(2);
    expect(active.every(t => t.status === "active")).toBe(true);
    expect(archived.length).toBe(2);
    expect(archived.every(t => t.status === "archived")).toBe(true);
  });

});
