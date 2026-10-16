import { useEffect, useState } from 'react';
import { fetchDepartmentOptions } from '../api';

export function DepartmentSelect({ value, onChange }: { value: string; onChange(value: string): void }) {
  const [options, setOptions] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetchDepartmentOptions().then((data) => { if (active) setOptions(data.departments); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  const values = value && !options.includes(value) ? [value, ...options] : options;
  return <select value={value} onChange={(event) => onChange(event.target.value)}>
    <option value="">{failed ? '部门选项加载失败，可暂不选择' : '请选择部门小组（可稍后完善）'}</option>
    {values.map((name) => <option key={name} value={name}>{name}</option>)}
  </select>;
}
