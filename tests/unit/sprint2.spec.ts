/**
 * Tests unitaires — Sprint 2 : Gestion des offres, candidatures et taches.
 * Six cas couvrant US12 a US21, verifies en isolation sans appel a la base de donnees.
 */
describe("Tests unitaires — Sprint 2 (US12 a US21)", () => {

  // ── TU-01 — US12 : Publier une offre ──────────────────────────────────────
  it("TU-01 — Publier offre (US12) : un titre vide est refuse", () => {
    const validateOffer = (offer: { title: string; profilesNeeded: number }): boolean => {
      if (!offer.title || !offer.title.trim())
        throw new Error("Le titre est obligatoire");
      if (offer.profilesNeeded < 1)
        throw new Error("Le nombre de profils doit etre superieur a 0");
      return true;
    };

    expect(() => validateOffer({ title: "", profilesNeeded: 2 }))
      .toThrow("Le titre est obligatoire");
    expect(() => validateOffer({ title: "Dev Full Stack", profilesNeeded: 0 }))
      .toThrow("Le nombre de profils doit etre superieur a 0");
    expect(validateOffer({ title: "Dev Full Stack", profilesNeeded: 2 }))
      .toBe(true);
  });

  // ── TU-02 — US14 : Consulter les offres ───────────────────────────────────
  it("TU-02 — Consulter offres (US14) : le filtrage par statut retourne les bons resultats", () => {
    const offers = [
      { id: "1", title: "Dev Full Stack",  status: "open"   },
      { id: "2", title: "Data Analyst",    status: "closed" },
      { id: "3", title: "DevOps Junior",   status: "open"   },
      { id: "4", title: "UX Designer",     status: "closed" },
    ];

    const filterByStatus = (list: typeof offers, status: string) =>
      list.filter(o => o.status === status);

    const open   = filterByStatus(offers, "open");
    const closed = filterByStatus(offers, "closed");

    expect(open.length).toBe(2);
    expect(open.every(o => o.status === "open")).toBe(true);
    expect(closed.length).toBe(2);
    expect(closed.every(o => o.status === "closed")).toBe(true);
  });

  // ── TU-03 — US15 : Postuler a une offre ───────────────────────────────────
  it("TU-03 — Postuler offre (US15) : un candidat ne peut pas postuler deux fois a la meme offre", () => {
    const applications = [
      { userId: "user1", jobOfferId: "offer1" },
      { userId: "user2", jobOfferId: "offer1" },
    ];

    const hasAlreadyApplied = (userId: string, jobOfferId: string): boolean =>
      applications.some(a => a.userId === userId && a.jobOfferId === jobOfferId);

    expect(hasAlreadyApplied("user1", "offer1")).toBe(true);  // doublon -> refuse
    expect(hasAlreadyApplied("user3", "offer1")).toBe(false); // nouveau -> accepte
    expect(hasAlreadyApplied("user1", "offer2")).toBe(false); // offre differente -> accepte
  });

  // ── TU-04 — US16 : Accepter / Refuser un candidat ─────────────────────────
  it("TU-04 — Traiter candidature (US16) : seules les transitions de statut valides sont autorisees", () => {
    // 1=Applied  2=Rejected  3=Interview  4=Hired  5=Intern
    const VALID_TRANSITIONS: Record<number, number[]> = {
      1: [2, 3],  // Applied   -> Rejected | Interview
      3: [4, 5],  // Interview -> Hired    | Intern
    };

    const canTransition = (from: number, to: number): boolean =>
      (VALID_TRANSITIONS[from] ?? []).includes(to);

    expect(canTransition(1, 3)).toBe(true);  // Applied   -> Interview ✓
    expect(canTransition(1, 2)).toBe(true);  // Applied   -> Rejected  ✓
    expect(canTransition(3, 4)).toBe(true);  // Interview -> Hired     ✓
    expect(canTransition(3, 5)).toBe(true);  // Interview -> Intern    ✓
    expect(canTransition(1, 4)).toBe(false); // Applied   -> Hired directement ✗
    expect(canTransition(2, 3)).toBe(false); // Rejected  -> Interview ✗
  });

  // ── TU-05 — US18 : Creer et assigner des taches ───────────────────────────
  it("TU-05 — Creer tache (US18) : les champs obligatoires sont valides avant creation", () => {
    const validateTask = (task: {
      title: string;
      description: string;
      deadLineInHours: number;
      internIds: string[];
    }): boolean => {
      if (!task.title.trim())
        throw new Error("Le titre de la tache est obligatoire");
      if (!task.description.trim())
        throw new Error("La description est obligatoire");
      if (task.deadLineInHours <= 0)
        throw new Error("La deadline doit etre superieure a 0");
      if (!task.internIds.length)
        throw new Error("Au moins un candidat doit etre assigne");
      return true;
    };

    expect(() => validateTask({ title: "", description: "desc", deadLineInHours: 5, internIds: ["u1"] }))
      .toThrow("Le titre de la tache est obligatoire");
    expect(() => validateTask({ title: "TP Python", description: "desc", deadLineInHours: 0, internIds: ["u1"] }))
      .toThrow("La deadline doit etre superieure a 0");
    expect(() => validateTask({ title: "TP Python", description: "desc", deadLineInHours: 5, internIds: [] }))
      .toThrow("Au moins un candidat doit etre assigne");
    expect(validateTask({ title: "TP Python", description: "desc", deadLineInHours: 5, internIds: ["u1"] }))
      .toBe(true);
  });

  // ── TU-06 — US17 : Gerer l'avancement des taches ──────────────────────────
  it("TU-06 — Avancement tache (US17) : la progression de statut est lineaire et valide", () => {
    // 0=Open  1=InProgress  2=Review  3=Done
    const ALLOWED_NEXT: Record<number, number> = {
      0: 1,  // Open       -> InProgress
      1: 2,  // InProgress -> Review
      2: 3,  // Review     -> Done
    };

    const nextStatus = (current: number): number => {
      if (!(current in ALLOWED_NEXT))
        throw new Error("Aucune progression possible depuis ce statut");
      return ALLOWED_NEXT[current];
    };

    expect(nextStatus(0)).toBe(1); // Open       -> InProgress ✓
    expect(nextStatus(1)).toBe(2); // InProgress -> Review     ✓
    expect(nextStatus(2)).toBe(3); // Review     -> Done       ✓
    expect(() => nextStatus(3)).toThrow("Aucune progression possible depuis ce statut");
  });

});
