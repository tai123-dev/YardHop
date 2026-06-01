import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import SaleCard from "../components/SaleCard";

const DOT_COLORS = { estate: "#534AB7", garage: "#BA7517", backyard: "#1D9E75", moving: "#854F0B" };
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen({ sales, saved, onToggleSave }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4); // May
  const [selectedDay, setSelectedDay] = useState(26);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const salesOnDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return sales.filter((s) => dateStr >= s.startDate && dateStr <= s.endDate);
  };

  const selectedSales = salesOnDay(selectedDay);
  const selectedDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const today = new Date().toISOString().split("T")[0];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(1);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f5f4f0" }} contentContainerStyle={{ padding: 16 }}>
      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={styles.navArrow}>‹</Text></TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={styles.navArrow}>›</Text></TouchableOpacity>
      </View>

      {/* Day of week labels */}
      <View style={styles.grid}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
        ))}

        {/* Empty padding cells */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <View key={`pad-${i}`} style={styles.dayCell} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const daySales = salesOnDay(day);
          const isToday = dateStr === today;
          const isSelected = day === selectedDay;

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && !isSelected && styles.dayCellToday,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[
                styles.dayNum,
                isSelected && { color: "#fff" },
                isToday && !isSelected && { color: "#0F6E56" },
                daySales.length > 0 && !isSelected && { color: "#1a1a1a", fontWeight: "700" },
              ]}>
                {day}
              </Text>
              {daySales.length > 0 && (
                <View style={styles.dotRow}>
                  {daySales.slice(0, 3).map((s) => (
                    <View
                      key={s.id}
                      style={[styles.dot, { backgroundColor: isSelected ? "#fff" : DOT_COLORS[s.type] || "#1D9E75" }]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day sales */}
      <Text style={styles.selectedLabel}>
        {selectedSales.length > 0
          ? `${selectedSales.length} sale${selectedSales.length > 1 ? "s" : ""} on ${MONTH_NAMES[month]} ${selectedDay}`
          : `No sales on ${MONTH_NAMES[month]} ${selectedDay}`}
      </Text>

      {selectedSales.length === 0 ? (
        <Text style={styles.noSales}>Nothing here — check another day 👀</Text>
      ) : (
        selectedSales.map((s) => (
          <SaleCard
            key={s.id}
            sale={s}
            saved={saved.includes(s.id)}
            onToggleSave={onToggleSave}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn: { padding: 6, borderRadius: 8, borderWidth: 0.5, borderColor: "#e5e3da", backgroundColor: "#fff" },
  navArrow: { fontSize: 20, color: "#888", lineHeight: 22 },
  monthLabel: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  dayLabel: { width: "14.28%", textAlign: "center", fontSize: 11, color: "#aaa", fontWeight: "600", paddingVertical: 4 },
  dayCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8, gap: 2 },
  dayCellSelected: { backgroundColor: "#1D9E75" },
  dayCellToday: { backgroundColor: "#E1F5EE" },
  dayNum: { fontSize: 13, color: "#aaa" },
  dotRow: { flexDirection: "row", gap: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  selectedLabel: { fontSize: 12, fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  noSales: { textAlign: "center", color: "#ccc", fontSize: 14, paddingVertical: 32 },
});
