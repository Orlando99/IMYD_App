import * as Consts from '../configs/constants';
import { DEFAULT_PROPS } from '../components/Feedback';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function feedback(state = DEFAULT_PROPS, action) {

	switch (action.type) {
		case Consts.SET_FEEDBACK:
			return {
				...state,
				...action.feedback
			};
			break;
		default: {
			return state;
		}
	}
}

