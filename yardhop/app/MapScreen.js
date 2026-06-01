import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";
import SaleCard from "../components/SaleCard";
import { TYPE_STYLES } from "../data/sales";

let MapView, Marker;
if (Platform.OS !== "web") {
  ({ default: MapView, Marker } = require("react-native-maps"));
}

const today = new Date().toISOString().split("T")[0];

export default function MapScreen({ sales, saved, onToggleSave, onSelectSale }) {
  const region = {
    latitude: 35.1095,
    longitude: -106.613,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === "web" ? (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Map view available on mobile</Text>
        </View>
      ) : (
        <MapView style={styles.map} initialRegion={region} showsUserLocation>
          {sales.map((sale) => {
            const isSaved = saved.includes(sale.id);
            const isToday = sale.startDate === today;
            const pinColor = isSaved ? "#BA7517" : isToday ? "#3C3489" : "#1D9E75";

            return (
              <Marker
                key={sale.id}
                coordinate={{ latitude: sale.lat, longitude: sale.lng }}
                onPress={() => onSelectSale(sale)}
              >
                <View style={[styles.pin, { backgroundColor: pinColor }]}>
                  <Text style={styles.pinText}>
                    {isSaved ? "⭐ " : ""}{isToday ? "Today" : sale.distance + "mi"}
                  </Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* Mini list below map */}
      <View style={styles.listWrap}>
        <Text style={styles.listLabel}>Nearby sales</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {sales.map((s) => (
            <SaleCard
              key={s.id}
              sale={s}
              saved={saved.includes(s.id)}
              onToggleSave={onToggleSave}
              onPress={onSelectSale}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 280 },
  mapPlaceholder: { height: 280, backgroundColor: "#dce8f0", alignItems: "center", justifyContent: "center" },
  mapPlaceholderText: { color: "#6b8a99", fontSize: 14, fontWeight: "500" },
  pin: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pinText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  listWrap: { flex: 1, backgroundColor: "#f5f4f0", padding: 12 },
  listLabel: { fontSize: 12, fontWeight: "600", color: "#aaa", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
});
