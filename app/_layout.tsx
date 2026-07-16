import { Drawer } from "expo-router/drawer";
import {
    DrawerContentScrollView,
    DrawerItem,
    type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { CommonActions, DrawerActions } from "@react-navigation/native";
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

const scripts = getAllScripts();
const scriptsById = new Map(scripts.map((s) => [s.id, s]));

function CustomDrawerContent(props: DrawerContentComponentProps) {
    const { state, navigation, descriptors } = props;

    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={{ paddingStart: 0, paddingEnd: 0 }}
        >
            {state.routes.map((route, i) => {
                const script = scriptsById.get(route.name);
                if (!script) return null;

                const focused = i === state.index;
                const { drawerLabel, drawerIcon, drawerLabelStyle, drawerItemStyle } =
                    descriptors[route.key].options;

                const onPress = () => {
                    const event = navigation.emit({
                        type: "drawerItemPress",
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!event.defaultPrevented) {
                        navigation.dispatch({
                            ...(focused
                                ? DrawerActions.closeDrawer()
                                : CommonActions.navigate(route)),
                            target: state.key,
                        });
                    }
                };

                return (
                    <DrawerItem
                        key={route.key}
                        label={drawerLabel ?? script.name}
                        icon={drawerIcon}
                        focused={focused}
                        activeBackgroundColor={script.colors.primary}
                        inactiveBackgroundColor={script.colors.background}
                        labelStyle={drawerLabelStyle}
                        style={drawerItemStyle}
                        onPress={onPress}
                    />
                );
            })}
        </DrawerContentScrollView>
    );
}

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

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
                <Drawer.Screen
                    name="index"
                    options={{
                        title: appTheme.name,
                        headerStyle: {
                            backgroundColor: appTheme.colors.background,
                        },
                        headerTitle: "",
                        headerTintColor: appTheme.colors.onPrimary,
                        drawerStyle: {
                            backgroundColor: appTheme.colors.background,
                        }
                    }}
                />
                <Drawer.Screen name="dev" options={{headerShown: false}} />
                {scripts.map((script) => (
                    <Drawer.Screen
                        key={script.id}
                        name={script.id}
                        options={{
                            title: script.name,
                            headerStyle: {
                                backgroundColor: appTheme.colors.background,
                            },
                            headerTintColor: appTheme.colors.onPrimary,
                            headerTitleStyle: {
                                fontFamily: "NotoSerif_600SemiBold"
                            },
                            drawerLabel: script.name,
                            drawerIcon: ({ size }) => (
                                <Text
                                    style={{
                                        fontFamily: "NotoSerif_300Light",
                                        fontSize: size,
                                        color: script.colors.onPrimary,
                                        width: size + 8,
                                        textAlign: "center",
                                    }}
                                >
                                    {script.icon}
                                </Text>
                            ),
                            drawerStyle: {
                                backgroundColor: appTheme.colors.background,
                            },
                            drawerItemStyle: {
                                borderRadius: 0,
                                width: "100%",
                                paddingStart: 0,
                                paddingEnd: 0,
                            },
                            drawerLabelStyle: {
                                color: script.colors.onPrimary,
                                fontFamily: "NotoSerif_600SemiBold",
                                fontSize: 16,
                                textAlign: "center",
                                padding: 6,
                                paddingStart: 0,
                                paddingEnd: 0,
                            }
                        }}
                    />
                ))}
            </Drawer>
        </GestureHandlerRootView>
    );
}
