import React from 'react';
import { Image, StyleSheet, View, ViewProps, ImageStyle } from 'react-native';

// Require the asset to ensure it's bundled
const LOGO_SOURCE = require('../../assets/logo-icon-only.png');

interface LogoProps extends ViewProps {
    size?: number;
    variant?: 'light' | 'dark'; // In case we handle different backgrounds later
}

export const Logo: React.FC<LogoProps> = ({
    size = 64,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, style]} {...props}>
            <Image
                source={LOGO_SOURCE}
                style={{
                    width: size,
                    height: size,
                    resizeMode: 'contain',
                } as ImageStyle}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
