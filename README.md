# Rexo

This is a small utility to observe changes to complex objects, designed for applications with multiple files that need to listen for changes from a common object (e.g. a State).
In fact, this works perfectly when we work in React-like environments.
As Javascript devs know, native `observe` and `watch` methods were deprecated, probably for bad performance. Proxies then were created as a partial solution. RxJS implements greatly the Observable Pattern.

So I took them and merged them together: **Rexo** (_Rexursive-observer_ (Recursive + Rx))
The result is a typescript package that let you `subscribe` to objects and nested objects in a very easy way.


### Install

```sh
$ npm install --save rexo
```

<br>
<hr>

### Usage example


In this usage example, I'm supposing you are using Typescript to show you the real advantage of this package.

You simply need to instantiate a new class for every external object (not nested ones) you want to observe. Easily pass the interface that defines your Object as generic parameter of `ObservableObject`. This will let you, in Typescript, to access to object's properties, like
`nestedObjects.firstProperty`. Else, Typescript will not recognize it.

```typescript
interface CustomObject {
	// here lays you object definition
	firstProperty: number,
	secondProperty: {
		third: number,
		fiftyfive: {
			anotherNestedProperty: number
		}
	}
}

const nestedObjects = new ObservableObject<CustomObject>({
	firstProperty: 5,
	secondProperty: {
		third: 7,
		fiftyfive: {
			anotherNestedProperty: 55
		}
	}
});

// Subscribe to the object changes.

const firstPropertyObserver = nestedObjects.observe("firstProperty");
const subscription = firstPropertyObserver.subscribe({
	next: (newValue => {
		console.log("first property changed!");
	});
});

const sub1 = nestedObjects.observe("secondProperty.fiftyfive.anotherNestedProperty")
	.subscribe( ... );


// Else where, edit this object.

nestedObjects.firstProperty = 1;

nestedObjects.secondProperty = {
	third: 3,
	fiftyfive: {
		anotherNestedProperty: 4;
	}
}
```

<br>
<br>

___

## Documentation
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
| optHandlers | ProxyHandler<any> | Other handlers through which the object changes developers may them want to pass. A set handler will be executed before the notification will happen, within the current one. If a set handler will return `false`, it will stop the execution and won't notify for the changes | `true` | `{}` |

<br>

___

<br>

**.observe()**

```typescript
observableObject.observe<T = any>(prop: string): Subject<T>;
```

**Description**:

Use this method to register a Subject to subscribe to.
To avoid confusion between Subject `.unsubscribe` and Subscription `.unsubscribe`, the returned Subject will unsubscribe only the registered `Subscriptions` without closing/stopping the Subject, even if (I know...), Subject shouldn't be reusable.

This methods accepts a generic type `T` that will be passed to the creation of the Subject.

<br>

**Returns**:

`Subject<T>`

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

Performs unbscription on all the passed `Subscription`;

<br>
___
<br>

**.snapshot()**

```typescript
observableObject.snapshot(): T;
```

**Description**:

Returns the current clean object structure.

<br>
<br>

___

### Defining own traps

This package has been built with in mind the possibility to be extended as much as possible.
In fact, to the constructor, when creating a new observable object, custom proxy handlers are available to be passed.

As v1.0.0, *getter* and *setter* are the only two handlers that are "protected": they cannot be fully overridden, but they will be attached to the integrated ones and may alter the behaviour of the current ones.
For example, make the custom setter return false to not assign the value.
Be sure to be in *non-strict-mode*.

The default getter is there to pass you only the values related to the object you want to observe.
All the other traps are free, but, as *setter* and *getter*, they will be applied to every nested object. So be sure to implement the appropriate checks.

___
### Testing

Some tests based on Jasmine, are available to be executed to show how this package works.

```sh
$ npm install -D
$ npm test
```
___
___
### Credits ⭐
___
This small package is a fork of a package, created by me, while working at [IdeaSolutions S.r.l.](http://www.ideasolutions.it/), an Italian company based in Naples, Italy. A great company to work for.

<br>
<br>

___

Made with ❤ in Italy.
Every contribution is welcome.
