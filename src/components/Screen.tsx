import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ViewProps } from 'react-native';
import { theme } from '../theme';

interface ScreenProps extends ViewProps {
    children: React.ReactNode;
    safeArea?: boolean;
    backgroundColor?: string;
    padding?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
    children,
    safeArea = true,
    backgroundColor = theme.colors.background,
    padding = false,
    style,
    ...props
}) => {
    const Container = safeArea ? SafeAreaView : View;

    return (
        <Container style={[styles.container, { backgroundColor }, style]} {...props}>
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
            <View style={[styles.content, padding && styles.padding]}>
                {children}
            </View>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    padding: {
        padding: theme.layout.containerPadding,
    },
});
