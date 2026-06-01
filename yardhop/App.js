import { useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StatusBar, StyleSheet, Platform,
} from "react-native";
import MapScreen from "./app/MapScreen";
import CalendarScreen from "./app/CalendarScreen";
import BrowseScreen from "./app/BrowseScreen";
import PostScreen from "./app/PostScreen";
import SaleDetail from "./components/SaleDetail";
import { SALES } from "./data/sales";

const TABS = [
  { id: "map",      label: "Map",      emoji: "🗺️" },
  { id: "calendar", label: "Calendar", emoji: "📅" },
  { id: "browse",   label: "Browse",   emoji: "📋" },
  { id: "post",     label: "Post Sale",emoji: "➕" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [saved, setSaved] = useState([2]);
  const [sales, setSales] = useState(SALES);
  const [selectedSale, setSelectedSale] = useState(null);
  const [search, setSearch] = useState("");

  const toggleSave = (id) =>
    setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const handlePost = (newSale) => {
    setSales((s) => [
      ...s,
      { ...newSale, id: Date.now(), lat: 35.108, lng: -106.612, distance: 0.6, type: "garage" },
    ]);
    setActiveTab("browse");
  };

  const filteredSales = sales.filter(
    (s) =>
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  const renderScreen = () => {
    switch (activeTab) {
      case "map":
        return <MapScreen sales={filteredSales} saved={saved} onToggleSave={toggleSave} onSelectSale={setSelectedSale} />;
      case "calendar":
        return <CalendarScreen sales={filteredSales} saved={saved} onToggleSave={toggleSave} />;
      case "browse":
        return <BrowseScreen sales={filteredSales} saved={saved} onToggleSave={toggleSave} onSelectSale={setSelectedSale} />;
      case "post":
        return <PostScreen onPost={handlePost} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.safe, Platform.OS === "web" && { height: "100vh" }]}>
      <StatusBar barStyle="dark-content" />

      {/* Top bar */}
      <View style={styles.topbar}>
        <View style={styles.logo}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>YardHop</Text>
        </View>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 14, color: "#aaa" }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search neighborhood or zip…"
            placeholderTextColor="#bbb"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Screen content */}
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(({ id, label, emoji }) => (
          <TouchableOpacity
            key={id}
            style={styles.tab}
            onPress={() => setActiveTab(id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabEmoji, activeTab === id && styles.tabEmojiActive]}>{emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === id && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sale detail modal */}
      {selectedSale && (
        <SaleDetail
          sale={selectedSale}
          saved={saved.includes(selectedSale.id)}
          onToggleSave={toggleSave}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e3da",
    backgroundColor: "#fff",
  },
  logo: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1D9E75" },
  logoText: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f5f4f0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#e5e3da",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1a1a1a" },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e3da",
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", gap: 2 },
  tabEmoji: { fontSize: 20, opacity: 0.35 },
  tabEmojiActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: "#bbb", fontWeight: "500" },
  tabLabelActive: { color: "#1D9E75", fontWeight: "700" },
});
