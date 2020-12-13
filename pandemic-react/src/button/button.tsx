import { FC } from "react";
import { Container, Text } from "react-pixi-fiber";
import ButtonBackground from "./ButtonBackground";

export const baseButtonHeight = 75;
export const baseButtonWidth = 100;

export interface ButtonProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  disabled: boolean;
  onTap: () => void;
}

const Button: FC<ButtonProps> = (props) => {
  const { x, y, width, height, label, disabled, onTap } = props;
  return (
    <Container interactive={true} buttonMode={true} pointerdown={onTap}>
      <ButtonBackground {...props}></ButtonBackground>
      <Text
        text={label}
        x={x + baseButtonWidth / 5}
        y={y + baseButtonHeight / 3}
        style={{ file: disabled ? 0x696969 : 0x000000 }}
      ></Text>
    </Container>
  );
};

export default Button;
