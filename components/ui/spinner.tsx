'use client'

interface SpinnerProps {
  size?: number
  color?: string
}

export function Spinner({ size = 24, color = '#C9A96E' }: SpinnerProps) {
  // Shadow color is a darker/transparent version of the ball color
  const shadowColor = color === '#1C1C1C'
    ? 'rgba(0,0,0,0.3)'
    : 'rgba(201,169,110,0.35)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow ellipse at the bottom */}
      <ellipse cx="12" cy="21.5" rx="4" ry="1.5" fill={shadowColor}>
        {/* Shadow grows wide + dark when ball lands, shrinks when ball rises */}
        <animate
          id="shadow_grow"
          begin="0;shadow_shrink.end"
          attributeName="rx"
          calcMode="spline"
          dur="0.375s"
          values="1;4"
          keySplines=".33,0,.66,.33"
          fill="freeze"
        />
        <animate
          begin="shadow_grow.end"
          attributeName="rx"
          calcMode="spline"
          dur="0.05s"
          values="4;4.8;4"
          keySplines=".33,0,.66,.33;.33,.66,.66,1"
        />
        <animate
          id="shadow_pause"
          begin="shadow_grow.end"
          attributeName="rx"
          calcMode="spline"
          dur="0.025s"
          values="4;4.2"
          keySplines=".33,0,.66,.33"
        />
        <animate
          id="shadow_shrink"
          begin="shadow_pause.end"
          attributeName="rx"
          calcMode="spline"
          dur="0.4s"
          values="4.2;1"
          keySplines=".33,.66,.66,1"
        />

        {/* Shadow opacity — dark on land, faint when ball is high */}
        <animate
          begin="0;shadow_op_shrink.end"
          attributeName="opacity"
          calcMode="spline"
          dur="0.375s"
          values="0.1;0.5"
          keySplines=".33,0,.66,.33"
          fill="freeze"
        />
        <animate
          id="shadow_op_pause"
          begin="shadow_grow.end"
          attributeName="opacity"
          calcMode="spline"
          dur="0.075s"
          values="0.5;0.5"
          keySplines=".33,0,.66,.33"
        />
        <animate
          id="shadow_op_shrink"
          begin="shadow_op_pause.end"
          attributeName="opacity"
          calcMode="spline"
          dur="0.4s"
          values="0.5;0.1"
          keySplines=".33,.66,.66,1"
        />
      </ellipse>

      {/* Ball */}
      <ellipse cx="12" cy="5" rx="4" ry="4" fill={color}>
        <animate
          id="spinner_jbYs"
          begin="0;spinner_JZdr.end"
          attributeName="cy"
          calcMode="spline"
          dur="0.375s"
          values="5;20"
          keySplines=".33,0,.66,.33"
          fill="freeze"
        />
        <animate
          begin="spinner_jbYs.end"
          attributeName="rx"
          calcMode="spline"
          dur="0.05s"
          values="4;4.8;4"
          keySplines=".33,0,.66,.33;.33,.66,.66,1"
        />
        <animate
          begin="spinner_jbYs.end"
          attributeName="ry"
          calcMode="spline"
          dur="0.05s"
          values="4;3;4"
          keySplines=".33,0,.66,.33;.33,.66,.66,1"
        />
        <animate
          id="spinner_ADF4"
          begin="spinner_jbYs.end"
          attributeName="cy"
          calcMode="spline"
          dur="0.025s"
          values="20;20.5"
          keySplines=".33,0,.66,.33"
        />
        <animate
          id="spinner_JZdr"
          begin="spinner_ADF4.end"
          attributeName="cy"
          calcMode="spline"
          dur="0.4s"
          values="20.5;5"
          keySplines=".33,.66,.66,1"
        />
      </ellipse>
    </svg>
  )
}
