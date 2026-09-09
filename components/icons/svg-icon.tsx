interface SvgIconProps {
  fill?: string
  width?: number | string
  height?: number | string
  src?: string
}

export function SvgIcon({
  fill = "currentColor",
  width = 25,
  height = 25,
  src: SVGComponent
}: SvgIconProps) {
  return (
    <div style={{ width, height }}>
      <SVGComponent style={{ fill }} />
    </div>
  );
}
