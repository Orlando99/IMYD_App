import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Select from 'select2';

export default class AutocompleteTag extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		}
	}

	componentWillReceiveProps(props) {
		this.state = {
			...props
		};
	}

	_init(){
		const node = ReactDOM.findDOMNode(this);
		$(node).select2({
			createTag: this.props.createTag ?
				(tag) => {
					return { id: tag.term, text: tag.term, isNew: true };
				} :
				() => null,
			tags: this.props.tags != null ? this.props.tags : true,
			placeholder: this.props.placeholder,
			allowClear: this.props.allowClear != null ? this.props.allowClear : true,
			templateResult: this.props.template,
			templateSelection: this.props.templateSelection
		});

		if (this.props.value) {
			$(node).val(this.props.value).trigger('change');
		}
		if (this.props.onChange) {
			$(node).on('change', this.props.onChange.bind(this));
		}
		if (this.props.preventRemove) {
			$(node).on('select2:unselecting', (e) => {
				e.preventDefault();
				e.stopPropagation();
				return false;
			});
		}
		if (this.props.onUnselect) {
			$(node).on('select2:unselecting', (e) => {
				if (!this.props.onUnselect(e) === false) {
					return false;
				}
			});
		}
		if (this.props.onSelect) {
			$(node).on('select2:selecting', (e) => {
				if (this.props.onSelect(e) === false) {
					return false;
				}
			});
		}
	}

	componentDidMount() {
		this._init();
	}

	clear() {
		const node = ReactDOM.findDOMNode(this);
		$(node).select2('val', '');
		$(node).select2('destroy');
	}

	get value() {
		const node = ReactDOM.findDOMNode(this);
		return $(node).select2().val();
	}

	render() {
		const options = this.state.options.map((option) => {
			return <option key={option.value} value={option.value}>{option.name}</option>;
		});

		return (
			<select className="autocomplete-tags" multiple="multiple">
				{options}
			</select>
		);
	}
};
