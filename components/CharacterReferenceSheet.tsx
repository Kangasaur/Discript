import {
    View,
    Text,
    ScrollView,
    StyleSheet
} from "react-native";
import appTheme from "@/data/app.json";
import { AppTheme, Lesson, Entry } from "@/types/data";
import CharacterRefButton from "@/components/CharacterRefButton";

const theme = appTheme as AppTheme;

interface Props {
    lesson: Lesson;
}

export default function CharacterReferenceSheet({lesson} : Props) {
    return (
        <ScrollView style={styles.scroll} contentContainerStyle={{alignContent:"center"}}>
            <Text style={styles.title}>{lesson.title}</Text>
            <View style={styles.grid}>
                {lesson.entries.map((entry) => {
                    return (<CharacterRefButton key={entry.character} entry={entry} />);
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 28,
        fontFamily: "NotoSerif_700Bold",
        color: theme.colors.onPrimary,
        padding: 20,
        textAlign: "center",
    },
    scroll: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 6,
        borderColor: theme.colors.cardBorder,
        borderRadius: 8,
        borderWidth: 3,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
});