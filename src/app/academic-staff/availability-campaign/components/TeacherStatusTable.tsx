type Props = {
  campaignId: number;
};

export default function TeacherStatusTable({ campaignId }: Props) {
  return (
    <div className="text-sm text-muted-foreground">
      (Teacher status table placeholder) · Chiến dịch #{campaignId}
    </div>
  );
}

