import * as Consts from '../configs/constants';
import { DEFAULT_PROPS } from '../components/ContextMenu';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function contextMenu(state = DEFAULT_PROPS, action) {

	switch (action.type) {
		case Consts.SET_CONTEXT_MENU:
			return {
				...state,
				...action.contextMenu
			};
			break;
		default: {
			return state;
		}
	}
}

