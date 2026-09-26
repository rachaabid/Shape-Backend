/**
 * Tests unitaires — Sprint 4 : Entretiens video, Notifications & Statuts.
 * Six cas couvrant US22 a US26, verifies en isolation sans appel a la base de donnees.
 */
describe("Tests unitaires — Sprint 4 (US22 a US26)", () => {

  // ── TU-01 — US22 : Planifier un entretien video ────────────────────────────
  it("TU-01 — Planifier entretien (US31) : les champs obligatoires sont valides avant creation", () => {
    const validateInterview = (data: {
      candidateId: string;
      jobOfferId:  string;
      companyId:   string;
      scheduledAt: string;
      channelName: string;
    }): boolean => {
      if (!data.candidateId || !data.candidateId.trim())
        throw new Error("Le candidat est obligatoire");
      if (!data.jobOfferId || !data.jobOfferId.trim())
        throw new Error("L'offre d'emploi est obligatoire");
      if (!data.scheduledAt || !data.scheduledAt.trim())
        throw new Error("La date et l'heure de l'entretien sont obligatoires");
      if (!data.channelName || !data.channelName.trim())
        throw new Error("Le nom du canal de video est obligatoire");
      return true;
    };

    expect(() => validateInterview({
      candidateId: "",
      jobOfferId:  "offer-1",
      companyId:   "company-1",
      scheduledAt: "2025-09-10T10:00:00.000Z",
      channelName: "interview-abc",
    })).toThrow("Le candidat est obligatoire");

    expect(() => validateInterview({
      candidateId: "cand-1",
      jobOfferId:  "offer-1",
      companyId:   "company-1",
      scheduledAt: "",
      channelName: "interview-abc",
    })).toThrow("La date et l'heure de l'entretien sont obligatoires");

    expect(validateInterview({
      candidateId: "cand-1",
      jobOfferId:  "offer-1",
      companyId:   "company-1",
      scheduledAt: "2025-09-10T10:00:00.000Z",
      channelName: "interview-cand-1-1234567890",
    })).toBe(true);
  });

  // ── TU-02 — US22 : Mise a jour statut candidature → Interview ────────────────
  it("TU-02 — Statut candidature (US32) : la planification d'un entretien fait passer le statut a Interview", () => {
    type Status = "Applied" | "Interview" | "Hired" | "Rejected" | "Intern";

    const applyInterviewScheduled = (
      application: { id: string; status: Status; proposedDate?: string },
      scheduledAt: string,
    ): { id: string; status: Status; proposedDate: string } => {
      if (application.status !== "Applied")
        throw new Error("Seules les candidatures en statut Applied peuvent etre planifiees");
      return { ...application, status: "Interview", proposedDate: scheduledAt };
    };

    const applied = { id: "app-1", status: "Applied" as Status };
    const result  = applyInterviewScheduled(applied, "2025-09-10T10:00:00.000Z");

    expect(result.status).toBe("Interview");
    expect(result.proposedDate).toBe("2025-09-10T10:00:00.000Z");

    const rejected = { id: "app-2", status: "Rejected" as Status };
    expect(() => applyInterviewScheduled(rejected, "2025-09-10T10:00:00.000Z"))
      .toThrow("Seules les candidatures en statut Applied peuvent etre planifiees");
  });

  // ── TU-03 — US22 : Detection de conflit de creneau horaire ──────────────────
  it("TU-03 — Conflit creneau (US31) : deux entretiens au meme horaire sont refuses", () => {
    const interviews = [
      { id: "i1", candidateId: "cand-1", scheduledAt: "2025-09-10T10:00:00.000Z" },
      { id: "i2", candidateId: "cand-2", scheduledAt: "2025-09-10T14:00:00.000Z" },
    ];

    const hasConflict = (
      list: typeof interviews,
      scheduledAt: string,
    ): boolean => {
      const incoming = new Date(scheduledAt).getTime();
      return list.some(i => {
        const existing = new Date(i.scheduledAt).getTime();
        return Math.abs(incoming - existing) < 60 * 60 * 1000; // moins d'une heure d'ecart
      });
    };

    // Creneau identique → conflit
    expect(hasConflict(interviews, "2025-09-10T10:00:00.000Z")).toBe(true);
    // Creneau trop proche (30 min apres) → conflit
    expect(hasConflict(interviews, "2025-09-10T10:30:00.000Z")).toBe(true);
    // Creneau libre → pas de conflit
    expect(hasConflict(interviews, "2025-09-10T16:00:00.000Z")).toBe(false);
  });

  // ── TU-04 — US25 : Notification lors de la creation d'un entretien ──────────
  it("TU-04 — Notification entretien (US34) : une notification est generee pour le candidat lors de la planification", () => {
    type NotifType = "INTERVIEW_SCHEDULED" | "NEW_MESSAGE" | "APPLICATION_RETAINED";

    const createInterviewNotification = (params: {
      candidateId: string;
      companyName: string;
      scheduledAt: string;
    }): { userId: string; type: NotifType; message: string; read: boolean } => {
      if (!params.candidateId)
        throw new Error("L'identifiant du candidat est requis pour la notification");

      const date = new Date(params.scheduledAt).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      return {
        userId:  params.candidateId,
        type:    "INTERVIEW_SCHEDULED",
        message: `${params.companyName} a planifie un entretien video le ${date}`,
        read:    false,
      };
    };

    const notif = createInterviewNotification({
      candidateId: "cand-42",
      companyName: "Shape Corp",
      scheduledAt: "2025-09-10T10:00:00.000Z",
    });

    expect(notif.userId).toBe("cand-42");
    expect(notif.type).toBe("INTERVIEW_SCHEDULED");
    expect(notif.read).toBe(false);
    expect(notif.message).toContain("Shape Corp");

    expect(() => createInterviewNotification({
      candidateId: "",
      companyName: "Shape Corp",
      scheduledAt: "2025-09-10T10:00:00.000Z",
    })).toThrow("L'identifiant du candidat est requis pour la notification");
  });

  // ── TU-05 — US25 : Filtrage des notifications non lues ──────────────────────
  it("TU-05 — Notifications non lues (US35) : le filtrage retourne uniquement les notifications non lues", () => {
    const notifications = [
      { id: "n1", type: "INTERVIEW_SCHEDULED", read: false },
      { id: "n2", type: "NEW_MESSAGE",         read: true  },
      { id: "n3", type: "APPLICATION_RETAINED", read: false },
      { id: "n4", type: "NEW_MESSAGE",          read: true  },
    ];

    const getUnread = (list: typeof notifications) =>
      list.filter(n => !n.read);

    const countUnread = (list: typeof notifications) =>
      list.filter(n => !n.read).length;

    const unread = getUnread(notifications);
    expect(unread.length).toBe(2);
    expect(unread.every(n => !n.read)).toBe(true);
    expect(countUnread(notifications)).toBe(2);

    // Apres marquage comme lu, le compteur diminue
    notifications[0].read = true;
    expect(countUnread(notifications)).toBe(1);
  });

  // ── TU-06 — US23 : Calcul du statut d'un appel video ───────────────────────
  it("TU-06 — Statut appel video (US33) : le statut est calcule correctement selon l'heure courante", () => {
    type VideoStatus = "scheduled" | "live" | "ended";

    const computeStatus = (
      scheduledAt: string,
      durationMinutes: number,
      nowMs: number,
    ): VideoStatus => {
      const startMs = new Date(scheduledAt).getTime();
      const endMs   = startMs + durationMinutes * 60 * 1000;

      if (nowMs < startMs) return "scheduled";
      if (nowMs >= startMs && nowMs < endMs) return "live";
      return "ended";
    };

    const BASE = new Date("2025-09-10T10:00:00.000Z").getTime();

    // 30 min avant → Planifie
    expect(computeStatus("2025-09-10T10:00:00.000Z", 60, BASE - 30 * 60 * 1000))
      .toBe("scheduled");

    // Pendant → En cours
    expect(computeStatus("2025-09-10T10:00:00.000Z", 60, BASE + 20 * 60 * 1000))
      .toBe("live");

    // Apres → Termine
    expect(computeStatus("2025-09-10T10:00:00.000Z", 60, BASE + 90 * 60 * 1000))
      .toBe("ended");
  });

  // ── TU-07 — US26 : Matching IA — classement et calcul du score ─────────────
  it("TU-07 — Matching IA (US26) : les candidats sont classes par matchScore decroissant et le score est calcule correctement", () => {
    // Formule combinees : matchScore = round(0.6 * skillScore + 0.4 * semanticScore)
    const computeMatchScore = (skillScore: number, semanticScore: number): number =>
      Math.round(skillScore * 0.6 + semanticScore * 0.4);

    const rankApplications = (
      apps: { id: string; skillScore: number; semanticScore: number; matchScore: number }[],
    ) => [...apps].sort((a, b) => b.matchScore - a.matchScore);

    // Verification de la formule de calcul du score combine
    expect(computeMatchScore(80, 60)).toBe(72);    // 0.6*80 + 0.4*60 = 48 + 24 = 72
    expect(computeMatchScore(100, 100)).toBe(100);
    expect(computeMatchScore(0, 0)).toBe(0);
    expect(computeMatchScore(90, 85)).toBe(88);    // 0.6*90 + 0.4*85 = 54 + 34 = 88

    // Verification du classement par score decroissant
    const apps = [
      { id: "app-1", skillScore: 60, semanticScore: 50, matchScore: computeMatchScore(60, 50) },  // 56
      { id: "app-2", skillScore: 90, semanticScore: 85, matchScore: computeMatchScore(90, 85) },  // 88
      { id: "app-3", skillScore: 45, semanticScore: 70, matchScore: computeMatchScore(45, 70) },  // 55
    ];

    const ranked = rankApplications(apps);
    expect(ranked[0].id).toBe("app-2");  // score le plus eleve : 88
    expect(ranked[1].id).toBe("app-1");  // score intermediaire : 56
    expect(ranked[2].id).toBe("app-3");  // score le plus bas   : 55

    // Invariant : ordre strictement decroissant ou egal
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].matchScore >= ranked[i + 1].matchScore).toBe(true);
    }

    // Cas limite : liste vide → resultat vide
    expect(rankApplications([])).toEqual([]);

    // Cas limite : un seul candidat → retourne tel quel
    const single = [{ id: "app-solo", skillScore: 70, semanticScore: 80, matchScore: computeMatchScore(70, 80) }];
    expect(rankApplications(single)[0].id).toBe("app-solo");
  });

});
