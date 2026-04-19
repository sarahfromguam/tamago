interface Props {
  count: number;
}

export default function SupportBadge({ count }: Props) {
  if (count === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-4 py-1.5 text-sm font-semibold text-pink-600">
      <span>&#x1F497;</span>
      <span>
        {count} {count === 1 ? "person" : "people"} supported today
      </span>
    </div>
  );
}
