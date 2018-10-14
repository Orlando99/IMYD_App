export function syncWithContacts( contacts, contactToFind ) {
	const contact = contacts.find((contact) => {
		return contactToFind.username === contact.username;
	});

	return contact || {
			...contactToFind,
			username: contactToFind.username,
			name: contactToFind.username,
		};
}

export function usersToParticipants(obj){
	return Object.keys(obj).map((key) => {
		return { username: key, name: obj[key] }
	})
}