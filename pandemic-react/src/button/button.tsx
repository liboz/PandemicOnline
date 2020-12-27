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
  mouseover?: (event: PIXI.InteractionEvent) => void;
  mousemove?: (event: PIXI.InteractionEvent) => void;
  mouseout?: (event: PIXI.InteractionEvent) => void;
  widthRatio: number;
  heightRatio: number;
}

const Button: FC<ButtonProps> = (props) => {
  const { x, y, label, disabled, onTap, widthRatio, heightRatio } = props;

  const { mouseover, mousemove, mouseout, ...rest } = props;
  return (
    <Container
      interactive={true}
      buttonMode={true}
      pointerdown={onTap}
      mouseover={(event) => mouseover?.(event)}
      mousemove={(event) => mousemove?.(event)}
      mouseout={(event) => mouseout?.(event)}
    >
      <ButtonBackground
        {...rest}
        heightRatio={heightRatio}
        widthRatio={widthRatio}
      ></ButtonBackground>
      <Text
        text={label}
        x={(x + baseButtonWidth / 5) * widthRatio}
        y={(y + baseButtonHeight / 3) * heightRatio}
        style={{
          fontSize: 24 * widthRatio,
          fill: disabled ? 0x696969 : 0x000000,
        }}
      ></Text>
    </Container>
  );
};

export default Button;
