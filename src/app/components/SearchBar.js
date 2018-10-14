import React from 'react';

export default class SearchBar extends React.Component {

	constructor(props) {
		super(props);
		this.onSearch = this.onSearch.bind(this);
	}

	onSearch() {
		if (this.props.onSearch) {
			this.props.onSearch(this.refs.searchBox.value);
		}
	}

	render() {
		return (
			<div className="search-bar">
				<input 
					type="text"
					placeholder="Search"
					onChange={this.onSearch}
					ref="searchBox" />
				<span 
					className="glyphicon glyphicon-search"
					onClick={this.onSearch}> </span>
			</div>
		);
	}
}
