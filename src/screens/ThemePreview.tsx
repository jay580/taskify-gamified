import { View, Text, ScrollView } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Points from "../components/Points";
import Header from "../components/Header";
import { COLORS, SPACING, TYPOGRAPHY } from "../theme";

export default function ThemePreview() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <Header title="Theme Preview" />

      <ScreenWrapper>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* COLORS SECTION */}
          <View
            style={{
              backgroundColor: COLORS.surfaceAlt,
              padding: SPACING.md,
              borderRadius: 12,
              marginBottom: SPACING.lg,
            }}
          >
            <Text style={TYPOGRAPHY.heading}>Colors</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: SPACING.lg, marginTop: SPACING.md }}>
              {Object.entries(COLORS).map(([key, value]) => (
                <View key={key} style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      backgroundColor: value as string,
                      borderRadius: 8,
                      marginBottom: 4,
                    }}
                  />
                  <Text style={{ fontSize: 10 }}>{key}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* TYPOGRAPHY SECTION */}
          <View
            style={{
              backgroundColor: COLORS.surfaceAlt,
              padding: SPACING.md,
              borderRadius: 12,
              marginBottom: SPACING.lg,
            }}
          >
            <Text style={TYPOGRAPHY.heading}>Typography</Text>

            <View style={{ marginTop: SPACING.md }}>
              <Text style={TYPOGRAPHY.title}>Title Text</Text>
              <Text style={[TYPOGRAPHY.heading, { marginTop: SPACING.sm }]}>Heading Text</Text>
              <Text style={[TYPOGRAPHY.body, { marginTop: SPACING.sm }]}>Body Text</Text>
              <Text style={[TYPOGRAPHY.small, { marginTop: SPACING.sm }]}>Small Text</Text>
            </View>
          </View>

          {/* BUTTONS SECTION */}
          <View
            style={{
              backgroundColor: COLORS.surfaceAlt,
              padding: SPACING.md,
              borderRadius: 12,
              marginBottom: SPACING.lg,
            }}
          >
            <Text style={TYPOGRAPHY.heading}>Buttons</Text>

            <View style={{ marginTop: SPACING.md }}>
              <Button title="Primary Button" onPress={() => {}} />
              <View style={{ height: 10 }} />
              <Button title="Danger Button" variant="secondary" onPress={() => {}} />
            </View>
          </View>

          {/* CARD SECTION */}
          <View
            style={{
              backgroundColor: COLORS.surfaceAlt,
              padding: SPACING.md,
              borderRadius: 12,
              marginBottom: SPACING.lg,
            }}
          >
            <Text style={TYPOGRAPHY.heading}>Card</Text>

            <View style={{ marginTop: SPACING.md }}>
              <Card>
                <Text>This is a card component</Text>
                <Points value={10} />
              </Card>
            </View>
          </View>

          {/* BADGES SECTION */}
          <View
            style={{
              backgroundColor: COLORS.surfaceAlt,
              padding: SPACING.md,
              borderRadius: 12,
              marginBottom: SPACING.lg,
            }}
          >
            <Text style={TYPOGRAPHY.heading}>Badges</Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: SPACING.md }}>
              <Badge label="🔥 On Fire" />
              <Badge label="⭐ First Task" />
            </View>
          </View>

        </ScrollView>
      </ScreenWrapper>
    </View>
  );
}