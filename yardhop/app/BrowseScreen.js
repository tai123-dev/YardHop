import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import SaleCard from "../components/SaleCard";

const today = new Date().toISOString().split("T")[0];
const FILTERS = ["All", "Today", "This Weekend", "Furniture", "Clothing", "Antiques", "Tools", "Garden", "Saved ⭐"];

export default function BrowseScreen({ sales, saved, onToggleSave, onSelectSale }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = sales.filter((s) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Today") return s.startDate === today;
    if (activeFilter === "This Weekend") return ["2026-05-30", "2026-05-31"].includes(s.startDate);
    if (activeFilter === "Saved ⭐") return saved.includes(s.id);
    return s.categories.includes(activeFilter);
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f4f0" }}>
      {/* Filter chips */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.chip, activeFilter === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No sales match this filter</Text>
        ) : (
          filtered.map((s) => (
            <SaleCard
              key={s.id}
              sale={s}
              saved={saved.includes(s.id)}
              onToggleSave={onToggleSave}
              onPress={onSelectSale}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterWrap: { backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: "#e5e3da" },
  filterRow: { padding: 10, gap: 8, flexDirection: "row" },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 0.5, borderColor: "#e5e3da", backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#E1F5EE", borderColor: "#1D9E75" },
  chipText: { fontSize: 13, color: "#888" },
  chipTextActive: { color: "#0F6E56", fontWeight: "600" },
  list: { padding: 12 },
  empty: { textAlign: "center", color: "#ccc", fontSize: 14, paddingVertical: 48 },
});
