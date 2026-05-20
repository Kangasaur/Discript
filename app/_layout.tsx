import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text } from "react-native";
import {
    NotoSerif_300Light,
    NotoSerif_300Light_Italic,
    NotoSerif_400Regular,
    NotoSerif_400Regular_Italic,
    NotoSerif_600SemiBold,
    NotoSerif_600SemiBold_Italic,
    NotoSerif_700Bold,
    NotoSerif_700Bold_Italic,
    useFonts
} from "@expo-google-fonts/noto-serif";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { getAllScripts } from "@/contexts/ScriptTheme";
import appTheme from "@/data/app.json";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        NotoSerif_300Light,
        NotoSerif_300Light_Italic,
        NotoSerif_400Regular,
        NotoSerif_400Regular_Italic,
        NotoSerif_600SemiBold,
        NotoSerif_600SemiBold_Italic,
        NotoSerif_700Bold,
        NotoSerif_700Bold_Italic,
    })

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    const scripts = getAllScripts();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer>
                <Drawer.Screen
                    name="index"
                    options={{
                        title: appTheme.name,
                        drawerItemStyle: { display: "none" },
                    }}
                />
                {scripts.map((script) => (
                    <Drawer.Screen
                        key={script.id}
                        name={script.id}
                        options={{
                            title: script.name,
                            drawerLabel: script.name,
                            drawerIcon: ({ color, size }) => (
                                <Text
                                    style={{
                                        fontFamily: "NotoSerif_400Regular",
                                        fontSize: size,
                                        color,
                                        width: size + 8,
                                        textAlign: "center",
                                    }}
                                >
                                    {script.icon}
                                </Text>
                            ),
                        }}
                    />
                ))}
            </Drawer>
        </GestureHandlerRootView>
    );
}
