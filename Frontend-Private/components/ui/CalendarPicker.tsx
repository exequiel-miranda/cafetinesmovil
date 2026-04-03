import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const C = {
  bg:         '#0E0B24',
  card:       '#1A1640',
  cardHi:     '#231F52',
  border:     '#2E2A62',
  purple:     '#7B5CF5',
  purpleLight:'#9B7BFF',
  purpleDim:  'rgba(123,92,245,0.18)',
  textPri:    '#FFFFFF',
  textSec:    '#9B96C8',
  textMut:    '#4A4580',
  teal:       '#00D2A3',
};

interface Props {
  onSelect: (date: string) => void;
  initialDate?: string; // DD/MM/YYYY
}

export function CalendarPicker({ onSelect, initialDate }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(next);
  };

  const selectDay = (day: number) => {
    const d = day.toString().padStart(2, '0');
    const m = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const y = currentDate.getFullYear();
    onSelect(`${d}/${m}/${y}`);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(month, year);
  const startDay = firstDayOfMonth(month, year);

  const days = [];
  // Fill leading empty spots
  for (let i = 0; i < startDay; i++) {
    days.push(<View key={`empty-${i}`} style={s.dayBox} />);
  }
  // Fill month days
  const today = new Date();
  for (let day = 1; day <= totalDays; day++) {
    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    days.push(
      <TouchableOpacity 
        key={`day-${day}`} 
        style={[s.dayBox, isToday && s.todayBox]} 
        onPress={() => selectDay(day)}
        activeOpacity={0.7}
      >
        <Text style={[s.dayTxt, isToday && s.todayTxt]}>{day}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={s.navBtn}>
          <MaterialIcons name="chevron-left" size={24} color={C.textPri} />
        </TouchableOpacity>
        <Text style={s.monthTitle}>{monthNames[month]} {year}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={s.navBtn}>
          <MaterialIcons name="chevron-right" size={24} color={C.textPri} />
        </TouchableOpacity>
      </View>

      <View style={s.weekDays}>
        {dayNames.map((d, i) => (
          <Text key={`${d}-${i}`} style={s.weekDayTxt}>{d}</Text>
        ))}
      </View>

      <View style={s.grid}>
        {days}
      </View>
      
      <View style={s.info}>
        <View style={s.dot} />
        <Text style={s.infoTxt}>Hoy es {today.getDate()} de {monthNames[today.getMonth()]}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: C.card, borderRadius: 24, padding: 20, width: '100%', borderWidth: 1, borderColor: C.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.cardHi, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '800', color: C.textPri, letterSpacing: 0.5 },
  weekDays: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  weekDayTxt: { width: 34, textAlign: 'center', fontSize: 11, fontWeight: '800', color: C.textMut, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayBox: { width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  dayTxt: { fontSize: 15, fontWeight: '600', color: C.textSec },
  todayBox: { backgroundColor: C.purpleDim, borderRadius: 12, borderWidth: 1, borderColor: C.purple },
  todayTxt: { color: C.purple, fontWeight: '800' },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, padding: 12, backgroundColor: C.cardHi, borderRadius: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.purple },
  infoTxt: { fontSize: 12, color: C.textSec, fontWeight: '600' },
});
