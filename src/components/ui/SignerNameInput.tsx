import { Input } from './Input';

interface SignerNameInputProps {
  /** Full signer name (space-separated: last first patronymic) */
  value: string;
  /** Called with the joined full name whenever any part changes */
  onChange: (fullName: string) => void;
}

function splitName(fullName: string): [string, string, string] {
  const parts = fullName.split(' ');
  return [parts[0]?.trim() || '', parts[1]?.trim() || '', parts[2]?.trim() || ''];
}

export function SignerNameInput({ value, onChange }: SignerNameInputProps) {
  const [lastName, firstName, patronymic] = splitName(value);

  const updatePart = (index: number, newValue: string) => {
    const parts = [lastName, firstName, patronymic];
    parts[index] = newValue.trim().toUpperCase();
    onChange(parts.join(' '));
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Фамилия</label>
        <Input
          value={lastName}
          onChange={(e) => updatePart(0, e.target.value)}
          placeholder="Фамилия"
          uppercase
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Имя</label>
        <Input
          value={firstName}
          onChange={(e) => updatePart(1, e.target.value)}
          placeholder="Имя"
          uppercase
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Отчество</label>
        <Input
          value={patronymic}
          onChange={(e) => updatePart(2, e.target.value)}
          placeholder="Отчество"
          uppercase
        />
      </div>
    </div>
  );
}
