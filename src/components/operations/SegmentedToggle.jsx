import SubTabBar from '@/components/common/SubTabBar';

export default function SegmentedToggle({ value, onChange, options, compact }) {
  return <SubTabBar value={value} onChange={onChange} options={options} compact={compact} />;
}