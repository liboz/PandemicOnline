import * as PIXI from "pixi.js";
import { FC } from "react";
import { Container, CustomPIXIComponent, Text } from "react-pixi-fiber";
import ButtonBackground from "./ButtonBackground";

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
        x={x + width / 3}
        y={y + height / 3}
        style={{ file: disabled ? 0x696969 : 0x000000 }}
      ></Text>
    </Container>
  );
};

export default Button;
