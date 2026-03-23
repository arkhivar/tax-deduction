import { type LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
      <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
