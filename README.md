# Roxe

This is a lightweight utility created to observe changes to complex objects structures. This is mainly designed for event-driven applications, usually with multiple files, that need to execute some chunks of code when a common central object changes its status or its properties change.

It allows to listen to generic Object, nested object, Arrays, arrays' values, Objects in Arrays, Objects in Objects in Array changes and so on.

It merges the powerfulness of RxJS and ES Proxies to let developers subscribe to changes to every property, also nested ones and arrays, in the observed object.

___


### Install

```sh
$ npm install --save roxe
```

<br>
<hr>

### Usage example

In this usage example, I'm supposing you are using Typescript to show you the real force of this package.

Instantiate a new class for every root object you want to observe and pass the descriptive _typescript interface_ to `ObservableObject`'s generic parameter. This will let you to access to object's properties, like
`nestedObjects.foo`, without ignoring the errors.

Observe a specific chain-object (a dotted-separated string, as below) and then... subscribe!!! 🎉🎉🎉💁‍♂️

```typescript
interface CustomObject {
	// here lays you object definition
	foo: number;
	bar: {
		baz: number;
		beer: {
			beersAmount: number
		};
		valueSet: Array<{
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
			{ value: 5 }
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

/** Notification Result:
 * `foo: 3`
 */

// Now drinking a beer and probably something else
nestedObjects.bar = {
	baz: 3,
	beer: {
		beersAmount: 4;
	}
};

/** Notifications Result:
 * `bar.baz: 3`,
 * `bar.beer: { beersAmount: 4 }`,
 * `bar.beer.beersAmount: 4`,
 * `bar.valueSet: undefined`
 */

delete nestedObjects.bar;

/** Notification Result:
 * `bar.baz: undefined`,
 * `bar.beer: undefined`,
 * `bar.beer.beersAmount: undefined`
 */
```

<br>
<br>

___

## Documentation


**constructor()**

```typescript
new ObservableObject<T>(from?: T, optHandlers?: ProxyHandler<any>): T & ObservableObject<T>;
new ObservableObject(from, optHandlers);
```

**Arguments**:

| Key | Type | Description | Optional | Default |
|-----|:----:|-------------|:--------:|:-------:|
| from | T    | The object you want to observe | `true` | `{}` |
| optHandlers | ProxyHandler<any> | Other handlers through which the object changes developers may them want to pass through. A set handler will be executed before the notification will happen, within the current one. If a set handler will return `false`, it will stop the execution and won't notify for the changes | `true` | `{}` |

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

**.unsubscribeAll()**

```typescript
observableObject.unsubscribeAll(subscriptions: Subscription[]): void;
```

**Description**:

Performs unbscription on all the passed `Subscription`; Save all the subscriptions you create in an array and then pass it to the method to remove them all.
Then, initialize back the array to empty.

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
Use `debug` (see below) to get better info to which part of the path failed if the snapshot is undefined.

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

### Defining own traps

This package has been built with in mind the possibility to be extended as much as possible.
In fact, observable object's constructor allows custom proxy handlers to be passed.

As v1.0, *getter* and *setter* are the only two handlers that are "protected": they cannot be fully overridden, but the custom ones will be attached in queue to the integrated ones and may alter the behaviour of the current ones.
For example, make the custom setter return false to not assign the value.
Be sure to be in *non-strict-mode*.

The default getter is there to pass you only the values related to the object you want to observe.
All the other traps are free, but, as *setter* and *getter*, they will be applied to every nested object. So be sure to implement the appropriate checks.

> Be sure to not overload the traps, or your application performance may have affected.

___

### Debug

This package uses [Debug](https://github.com/visionmedia/debug) to show some messages.

To show those messages, start your package as:

```sh
# Bash / linux
$ DEBUG=roxe node app.js
```

To debug on different OSs, refer to [Debug](https://github.com/visionmedia/debug) package.

___
### Testing

Some tests based on Jasmine, are available to be executed to show how this package works.

```sh
$ npm install -D
$ npm test
```

___
### Caveats

This project compiles to a `CommonJS` module as the original project this comes from (see below), used Webpack, which does not digest `UMD` modules (using some loaders was breaking the debugging process for some reasons). If you'll need to get the UMD version, an npm script to achieve this has been made available. Follow the script below:

```sh
# !! change to the folder you want to clone into, first !!
git clone https://github.com/alexandercerutti/roxe.git;
cd roxe;
npm run build:umd;
```

This will output a new `umd/` folder with the generated files. To conclude the process, copy the whole content of `umd/` to a new `roxe` folder in your project and create a link or commit it this package on your repo to avoid losing it.

Another caveat is about the weight of this package. To be powerful, this package brings with it, as dependency, the whole Rx.JS library.
So, even if this library weights few KBs, Rx.JS contributes a lot to the general weight. This package might be considered as an extension for RxJS, but it won't have RxJS as `peerDependency` to allow everyone to use it in every context.

___
### Credits ⭐

This small package is a fork of a package, created by me, while working at [IdeaSolutions S.r.l.](http://www.ideasolutions.it/), an Italian company based in Naples, Italy. A great company to work for.

<br>
<br>

___

Made with ❤ in Italy.
Every contribution is welcome.
