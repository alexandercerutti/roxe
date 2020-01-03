# Roxe

![](https://img.shields.io/npm/v/roxe.svg?label=roxe)

Roxe is a lightweight utility created to observe changes to complex objects structures. This is mainly designed for event-driven applications, usually with multiple files, that need to execute some side effects, when a central object has its properties changed.

It allows to listen for changes of a generic Object, nested objects, Arrays, arrays' values, Objects in Arrays, Objects in Objects in Array, and... yeah, you got it.

It merges the powerfulness of RxJS and ES Proxies to let developers subscribe to changes to every property, also nested ones and arrays, in the observed object.

___

## Looking for previous version?

Check [v1.0.9 branch](https://github.com/alexandercerutti/roxe/tree/1.0.9). That branch is kept for reference only.

<br>

___


## Install

```sh
$ npm install --save roxe
```

<br>
<hr>

## Usage example

In this usage example, I'm supposing you are using Typescript to show you the real force of this package.

Instantiate a new class for every root object that contains a property you want to observe and pass the descriptive _typescript interface_ to `ObservableObject`'s generic parameter. This will let you to access to object's properties, like
`nestedObjects.foo`, without ignoring the errors.

Observe a specific chain-object (a dotted-separated string, as below) and then... subscribe!!! 🎉🎉🎉💁‍♂️

```typescript
import { ObservableObject } from "roxe";

interface CustomObject {
	// here lays you object definition
	foo: number;
	bar?: {
		baz: number;
		beer: {
			beersAmount: number
		};
		valueSet?: Array<{
			value: number;
			[key: string]: any;
		}>;
	}
}

const nestedObjects = new ObservableObject<CustomObject>({
	foo: 5,
	bar: {
		baz: 7,
		beer: {
			beersAmount: 55
		},
		valueSet: [
			{ value: 3 },
			{ value: 4 },
			{ value: 5 },
		],
	}
});

// Subscribe to the object changes.

const firstPropertyObserver = nestedObjects.observe("foo");
const subscription = firstPropertyObserver.subscribe({
	next: (newValue => {
		console.log("'foo' property changed!");
	});
});

const sub1 = nestedObjects.observe("bar.beer.beersAmount")
	.subscribe( ... );

const valueSetAmountSubscription = nestedObjects.observe("bar.valueSet.length").subscribe({
	next: (length: number) => {
		console.log(`valueSet amount just changed to ${length}`);
	}
});

const valueSetElementValueSubscription = nestedObjects.observe("bar.valueSet.3.value").subscribe({
	next: (newValue: number) => {
		console.log(`bar.valueSet's fourth element has been just added or has its 'value' field changed to ${newValue}`);
	}
})

// Else where, edit this object.

nestedObjects.foo = 1;

/**
 * Notifications:
 * 	`foo: 1`
 */

// Now drinking some beers and probably something else
nestedObjects.bar = {
	baz: 3,
	beer: {
		beersAmount: 4,
	}
};

/**
 * Notifications Result:
 *	bar: { baz: 3, beer: { beersAmount: 4 }};
 *	bar.baz: 3
 *	bar.beer: { beersAmount: 4 }
 *	bar.beer.beersAmount: 4
 *	bar.valueSet: undefined
 *	bar.valueSet[0].value: undefined
 *	bar.valueSet[0]: undefined
 *	bar.valueSet[1].value: undefined
 *	bar.valueSet[1]: undefined
 *	bar.valueSet[2].value: undefined
 *	bar.valueSet[2]: undefined
 *	bar.valueSet.length: undefined
 *
 * Holy shit, now I'm drunk 🥴😵
 */

delete nestedObjects.bar;

/**
 * Notification Result:
 * 	bar: undefined
 * 	bar.baz: undefined,
 * 	bar.beer: undefined,
 * 	bar.beer.beersAmount: undefined
 */
```

<br>
<br>

___

## API Documentation
___


**constructor()**

```typescript
new ObservableObject<T>(from?: T, optHandlers?: ProxyHandler<any>): T & ObservableObject<T>;
new ObservableObject(from, optHandlers);
```

**Arguments**:

| Key | Type | Description | Optional | Default |
|-----|:----:|-------------|:--------:|:-------:|
| from | T    | The object you want to observe | `true` | `{}` |
| optHandlers | ProxyHandler<any> | Other handlers through which the object changes developers may them want to pass through. A set handler will be executed before the notification will happen, within the current one. See more about custom traps at [Defining custom traps](#customtraps) below.  | `true` | `{}` |

<br>

___

<br>

**.observe()**

```typescript
observableObject.observe<A = any>(prop: string): Observable<A>;
```

**Description**:

Use this method to create an Observable to which you can subscribe to.
This methods accepts a generic type `A` that will be passed to the creation of the Subject.

<br>

**Returns**:

`Observable<A>`

<br>

**Arguments**:

| Key  | Type | Description |
|------|:----:|-------------|
| prop |string| The key-path to identify the property, or object, to observe. |

<br>

___
<br>

**.snapshot()**

```typescript
observableObject.snapshot(path?: string): any;
```

**Description**:

Returns a clean (no proxies or internal props) object structure or value of a nested property.
Returns `undefined` if the specified observed object doesn't own a middle or end key of the specified path.

<br>

**Arguments**:

| Key  | Type | Description |
|------|:----:|-------------|
| path |string| The key-path to identify the property, or object, to snap. |

**Caveats**:

Avoid to snap(shot) your fingers or Thanos will be happy.

<br>
<br>

___

<a name="customtraps"></a>

## Defining custom traps

This package has been built with in mind the possibility to be extendable as much as possible.
In fact, observable object's constructor allows custom proxy handlers to be passed. Traps will be applied to all the nested objects.

As v2.0, *set* and *deleteProperty*  are the only two handlers that are "protected": they cannot be fully overridden, but external ones will influence the final result of internal ones.

In fact, if a custom `set` returns **false**, properties won't be changed and notifications won't be fired.

If a custom `deleteProperty` returns **false**, notifications won't be executed and the property won't be removed from the object.

> Be sure to not overload the traps, or your application performance may have affected.

___
## Testing

Some tests based on Jasmine, are available to be executed to show how this package works.

```sh
$ npm install -D
$ npm test
```

___
## Caveats

This project compiles to a `CommonJS` module as the original project this comes from (see below), used Webpack, which does not digest `UMD` modules (using some loaders was breaking the debugging process for some reasons). If you'll need to get the UMD version, an npm script to achieve this has been made available. Follow the script below:

```sh
# !! change to the folder you want to clone into, first !!
git clone https://github.com/alexandercerutti/roxe.git;
cd roxe;
npm run build:umd;
```

This will output a new `umd/` folder with the generated files. To conclude the process, copy the whole content of `umd/` to a new `roxe` folder in your project and create a link or commit it this package on your repo to avoid losing it.

Another caveat is about the weight of this package. To be powerful, this package brings with it, as dependency, the whole RxJS library.
So, even if this library weights few KBs, Rx.JS contributes a lot to the general weight. This package might be considered as an extension for RxJS, but it won't have RxJS as `peerDependency` to allow everyone to use it in every context.

___
## Credits ⭐

This small package is a fork of a package, created by me, while working at [IdeaSolutions S.r.l.](http://www.ideasolutions.it/), an Italian company based in Naples, Italy. A great company to work for.

<br>
<br>

___

Made with ❤ in Italy.
Every contribution is welcome.
