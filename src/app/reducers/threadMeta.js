import * as Consts from '../configs/constants';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function threadMeta(state = {}, action) {
	switch (action.type) {
		case Consts.FETCH_THREADS_SUCCESS: {
			return {
				more: action.more,
				doneFetching: true
			};
		}

		default: {
			return state;
		}
	}
}
