import { buildNotificationChain } from "../src/buildNotificationChain";

it(`Should return a chain object if both are objects and not the same.
Unavailable old object keys in new object, will be undefined.`, () => {
	const prop = 'a';

	const coreObject = {
		'a': {
			[`${prop}1`]: 3,
			[`${prop}2`]: 4,
			[`${prop}4`]: 1,
			[`${prop}5`]: 6,
		},
		'b': 2,
		'c': 3,
	}

	const newObject = {
		'b1': 9,
		[`${prop}1`]: 42,
		[`${prop}2`]: 2,
		[`${prop}5`]: 6,
	};

	const expectedResult = {
		[prop]: newObject,
		[`${prop}.${prop}1`]: 42,
		[`${prop}.${prop}2`]: 2,
		[`${prop}.${prop}4`]: undefined,
		"a.b1": 9,
	};

	const result = buildNotificationChain(coreObject[prop], newObject, prop);

	return expect(result).toEqual(expectedResult);
});

it(`Should return a chain object with old object keys to undefined and the new value to newValue`, () => {
	const prop = 'a';

	const coreObject = {
		'a': {
			'a1': 3,
			'a2': 4,
			'a4': 1,
			'a5': 6,
		},
		'b': 2,
		'c': 3,
	};

	const newValue = 1;
	const expectedResult = {
		[prop]: newValue,
		[`${prop}.${prop}1`]: undefined,
		[`${prop}.${prop}2`]: undefined,
		[`${prop}.${prop}4`]: undefined,
		[`${prop}.${prop}5`]: undefined,
	};

	const result = buildNotificationChain(coreObject[prop], newValue, prop);

	return expect(result).toEqual(expectedResult);
});

it("Should return a chain composed with newValue object keys with their value and origin key with newValue", () => {
	const prop = 'a';

	const coreObject = {
		'a': 1,
		'b': 2,
		'c': 3,
	};

	const newValue = {
		[`${prop}1`]: 3,
		[`${prop}2`]: 4,
		[`${prop}4`]: 1,
		[`${prop}5`]: 6,
	};

	const expectedResult = {
		[prop]: newValue,
		[`${prop}.${prop}1`]: 3,
		[`${prop}.${prop}2`]: 4,
		[`${prop}.${prop}4`]: 1,
		[`${prop}.${prop}5`]: 6,
	};

	const result = buildNotificationChain(coreObject[prop], newValue, prop);

	return expect(result).toEqual(expectedResult);
});
