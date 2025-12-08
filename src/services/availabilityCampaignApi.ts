// Minimal stub to satisfy imports; replace with real API when available
export interface Campaign {
  id: number;
  title: string;
  deadline: string;
  createdAt: string;
}

const dummyCampaign: Campaign | null = null;

export const useGetLatestCampaignQuery = (): { data: Campaign | null; isLoading: boolean } => ({
  data: dummyCampaign,
  isLoading: false,
});

export const useSendRemindersMutation = (): [
  (id: number) => { unwrap: () => Promise<{ id: number }> },
  { isLoading: boolean },
] =>
  [
    (id: number) => ({
      unwrap: async () => ({ id }),
    }),
    { isLoading: false },
  ] as const;

export const useCreateCampaignMutation = (): [
  (body: { title: string; deadline: string }) => { unwrap: () => Promise<Campaign> },
  { isLoading: boolean },
] =>
  [
    (body: { title: string; deadline: string }) => ({
      unwrap: async () => ({
        ...body,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      }),
    }),
    { isLoading: false },
  ] as const;

