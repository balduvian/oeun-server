type Props = {
	cards: number | undefined;
};

export const CardDisplay = ({ cards }: Props) => (
	<svg
		xmlns="http://www.w3.org/2000/"
		viewBox="0 0 6.2 6.2"
		className="counter-svg"
	>
		<defs>
			<linearGradient
				id="linear-gradient"
				x1="4.1"
				y1="2.63"
				x2="3.04"
				y2="5.51"
				gradientTransform="translate(6.2 6.2) rotate(180)"
				gradientUnits="userSpaceOnUse"
			>
				<stop offset="0" stopColor="#414042" />
				<stop offset="1" stopColor="#1f1f1f" />
			</linearGradient>
			<linearGradient
				id="linear-gradient-2"
				x1="3.28"
				y1="1.62"
				x2="2.83"
				y2="2.81"
				gradientTransform="matrix(1, 0, 0, 1, 0, 0)"
				xlinkHref="#linear-gradient"
			/>
		</defs>
		<path
			className="cls-1"
			d="M3.1,5.6a.26.26,0,0,1-.24-.17L2,2.93.31,1a.26.26,0,0,1,0-.29A.25.25,0,0,1,.5.6H.55l2.6.5L5.65.6h0a.24.24,0,0,1,.21.12.24.24,0,0,1,0,.29L4.15,3,3.33,5.43A.25.25,0,0,1,3.1,5.6Z"
		/>
		<path
			className="cls-2"
			d="M5.7.85,4,2.85,3.1,5.35l-.87-2.5L.5.85l2.6.5L5.7.85m0-.5H5.6L3.1.84.59.36H.5A.48.48,0,0,0,.07.6a.5.5,0,0,0,0,.58L1.79,3.1l.84,2.41a.49.49,0,0,0,.94,0L4.41,3.1,6.07,1.18A.5.5,0,0,0,6.13.6.5.5,0,0,0,5.7.35Z"
		/>
		<rect
			className="cls-3"
			x="0.97"
			y="1.6"
			width="4.25"
			height="1"
			rx="0.13"
			ry="0.13"
		/>
		<path
			className="cls-4"
			d="M5.1,1.72v.75h-4V1.72h4m0-.25h-4a.25.25,0,0,0-.25.25v.75a.25.25,0,0,0,.25.25h4a.25.25,0,0,0,.25-.25V1.72a.25.25,0,0,0-.25-.25Z"
		/>
		{cards == undefined ? null : (
			<svg x="0.97" y="1.6" width="4.25" height="1" viewBox="0 0 425 100">
				<foreignObject className="size-display">
					{`카드 ${cards}장`}
				</foreignObject>
			</svg>
		)}
	</svg>
);
