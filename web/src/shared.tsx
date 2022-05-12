import * as react from 'react';
import * as util from './util';
import { Part } from './types';
import { WindowEvent } from './windowEvent';

export const pictureInput = (className: string, inputElement: react.ReactElement, imageName: string | undefined) => {
	return (
		<div className={className}>
			{inputElement}
			{imageName !== undefined ? (
				<img className="card-img" src={'/api/images/' + imageName} />
			) : (
				<div className="immr-image-placeholder">
					<span>Paste Image here</span>
				</div>
			)}
		</div>
	);
};

export const partName = (parts: Part[], partId: string | undefined) => {
	if (partId === undefined) return undefined;
	return parts.find(part => part.id === partId)?.english;
};

export const partOptions = (parts: Part[], selectedPart: string | undefined) => (
	<>
		{parts.map(part => (
			<option selected={part.id === selectedPart} value={part.id}>
				{part.english}
			</option>
		))}
		<option selected={selectedPart === undefined} value=""></option>
	</>
);

export const onPasteImage = async (event: react.ClipboardEvent<HTMLInputElement>): Promise<[ArrayBuffer, string]> => {
	const file = [...event.clipboardData.items].find(item => item.type === 'image/png' || item.type === 'image/jpeg')?.getAsFile() ?? undefined;
	if (file === undefined) return Promise.reject();

	const buffer = await file.arrayBuffer();

	return [buffer, 'paste-' + Date.now().toString() + '.jpg'];
};

export const goToNewPage = (path: string, args: [string, string][]) => {
	window.location.replace(
		(window.location.protocol + '//' + window.location.host + path + '?' + args.map(([key, value]) => `${key}=${value}&`).join('')).slice(0, -1),
	);
};

export const killCtrlZ = () => (
	<WindowEvent
		eventName="keydown"
		callBack={event => {
			/* this is some bullshit */
			if (event.code === 'KeyZ' && event.ctrlKey) event.preventDefault();
		}}
	></WindowEvent>
);
