import * as Consts from '../configs/constants';

export function setContextMenu(contextMenu) {
	contextMenu.date = contextMenu.date || Date.now();
	return {
		type: Consts.SET_CONTEXT_MENU,
		contextMenu
	};
}
