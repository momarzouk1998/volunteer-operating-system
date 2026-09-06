'use client';

import { useEffect, useState } from 'react';

export interface Lists {
  governorates: string[];
  teams: string[];
  levels: string[];
  convoyTypes: string[];
  taskTypes: string[];
  trainingTypes: string[];
  rewardTypes: string[];
  sources: string[];
  volunteerStatuses: { value: string; label: string }[];
  rules: { pointsPerHour: number; fullConvoyPoints: number; inactiveDays: number };
  listKeys: { key: string; label: string }[];
}

const EMPTY: Lists = {
  governorates: [],
  teams: [],
  levels: [],
  convoyTypes: [],
  taskTypes: [],
  trainingTypes: [],
  rewardTypes: [],
  sources: [],
  volunteerStatuses: [],
  rules: { pointsPerHour: 10, fullConvoyPoints: 50, inactiveDays: 60 },
  listKeys: [],
};

/** يجلب كل القوائم المنسدلة من قاعدة البيانات (نداء واحد، لا قوائم ثابتة في الكود). */
export function useLists() {
  const [lists, setLists] = useState<Lists>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/lists')
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.success) setLists({ ...EMPTY, ...d });
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  return { lists, loaded };
}
