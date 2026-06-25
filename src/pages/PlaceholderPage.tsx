type Props = { label: string };

export default function PlaceholderPage({ label }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#F7F7F8' }}>
      <div className="text-center">
        <p className="text-gray-400 text-sm">{label} module placeholder</p>
        <p className="text-gray-300 text-xs mt-1">Select the NPS tab to use the prototype.</p>
      </div>
    </div>
  );
}
