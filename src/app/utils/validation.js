export function validatePin(value, required) {
	const results = { isValid: true, field: 'pin' };
	if (required && !value) {
		results.isValid = false;
		results.msg = 'PIN is required';
	}
	else if (value && value.length !== 4) {
		results.isValid = false;
		results.msg = 'PIN length must be 4';
	}
	else if (value && /[^0-9]/.test(value)) {
		results.isValid = false;
		results.msg = 'PIN must be all numbers';
	}
	return results;
}

export function validateConfirmPin(pinValue, confirmValue) {
	const results = { isValid: true, field: 'confirmPin' };
	if (pinValue !== confirmValue) {
		results.isValid = false;
		results.msg = 'PIN numbers do not match';
	}
	return results;
}

export function validatePassword(value, required) {
	const results = { isValid: true, field: 'password' };
	if (required && !value) {
		results.isValid = false;
		results.msg = 'Password is required';
	}
	else if (value && !(/[A-Z]/g.test(value) && /[0-9]/g.test(value) && /[a-z]/g.test(value))) {
		results.isValid = false;
		results.msg = 'Passwords must have at least on lower case, one digit and one upper case character';
	} else if (value && value.length < 8) {
		results.isValid = false;
		results.msg = 'Passwords must be at least 8 characters';
	}
	return results;
}

export function validateConfirm(passwordValue, confirmValue) {
	const results = { isValid: true, field: 'confirm' };
	if (passwordValue !== confirmValue) {
		results.isValid = false;
		results.msg = 'Passwords do not match';
	}
	return results;
}
export function validateSecurityQuestion(value, required) {
	const results = { isValid: true, field: 'securityQuestion' };
	if (required && !value) {
		results.isValid = false;
		results.msg = 'Security question is required';
	}
	else if (value && value.length > 50) {
		results.isValid = false;
		results.msg = 'Security question must be 50 characters or less';
	}
	return results;
}

export function validateSecurityAnswer(value, required) {
	const results = { isValid: true, field: 'securityAnswer' };
	if (required && !value) {
		results.isValid = false;
		results.msg = 'Security answer is required';
	}
	else if (value && value.length > 50) {
		results.isValid = false;
		results.msg = 'Security answer must be 50 characters or less';
	}
	return results;
}

export function validateAnswerAndQuestion(securityQuestionValue, securityAnswerValue) {
	const results = { isValid: true };
	if (securityAnswerValue && !securityQuestionValue) {
		results.isValid = false;
		results.msg = 'Please fill in the question';
		results.field = 'securityQuestion';
	}
	else if (securityQuestionValue && !securityAnswerValue) {
		results.isValid = false;
		results.msg = 'Please fill in the answer';
		results.field = 'securityAnswer';
	}
	return results;
}