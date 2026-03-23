import { Stack } from "expo-router";
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

    return <Stack />;
}
