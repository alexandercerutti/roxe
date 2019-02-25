# Rexursive-Observer

This is a small utility to observe changes to complex objects.
As Javascript devs know, native `observe` and `watch` methods were suffering of poor performance and were deprecated. Proxies then were created as a partial solution. Also RxJS implements greatly the Observable Pattern.

So I took them and merged them: _**R**e**x**ursive-observer_
The result is a typescript package that let you `subscribe` to objects and nested objects in a very easy way.


### Install

```sh
$ npm install --save rexursive-observer
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
new ObservableObject<T>(from: T): T & ObservableObject<T>;
new ObservableObject(from);
```

**Arguments**:

| Key | Type | Description |
|-----|:----:|-------------|
| obj | T    | The object you want to observe |

<br>

___

<br>

**.observe()**

```typescript
observableObject.observe<T = any>(prop: string): SubscriptionFunnel<T>;
```

**Description**:

Use this method to create in the internal index a Subject that will serve to emit and consume the changes. This subject won't be accessible from the outside.
Once a Subject is created, it is "destroyed" only when `.unsubscribeAll` or `.dispose` are called.
This design choice was made to keep using the same subjects for every subscription without creating new ones every time.

This methods accepts a generic type `T` that will be passed to the creation of the Subject and the Subscription.

<br>

**Returns**:

`SubscriptionFunnel<T>`, a limited "Subscription" implementation (with only a custom rxjs' `subscribe` wrapper method) that will help into problems with unsubscriptions (as both Subjects and Subscriptions can be unsubscribed).
This method won't return a subscription, as the real `subscribe` method.
See below for more details.

<br>

**Arguments**:

| Key  | Type | Description |
|------|:----:|-------------|
| prop |string| The key-path to identify the property, or object, to observe. |

<br>

___
<br>


**SubscriptionFunnel.subscribe()**

```typescript
SubscriptionFunnel.subscribe(observer: PartialObserver<T>, ...operators: OperatorFunction<any, any>[]): void;
```

**Description**:

This is the real method that will notify your listners about your objects changes.
It accepts a `PartialObserver<T>` and a series of parameters, `operators` to be passed to Observable's `pipe` method.

<br>

**Arguments**:

| Key  | Type | Description |
|------|:----:|-------------|
| observer |[PartialObserver<T>](https://rxjs.dev/api/index/type-alias/PartialObserver)| Actions to be executed on changes |
| ...operators | [OperatorFunction<any, any>[]](https://rxjs.dev/api/index/interface/OperatorFunction) | The functions to be used as "modifiers for the current subscription" |

<br>

___
<br>

**.dispose()**

```typescript
observableObject.dispose(prop: string): void;
```

**Description**:

Removed from the internal index the subject and unsubscribes from it (or "closes" and "stops" it).

<br>

**Arguments**:

| Key  | Type | Description |
|------|:----:|-------------|
| prop |string| The key-path to identify the property, or object, to dispose |

<br>

___
<br>

**.unsubscribeAll()**

```typescript
observableObject.unsubscribeAll(): void;
```

**Description**:
Disposes and unsubscribe all the subjects.


<br>

___
<br>

**.removeSubscriptions()**

```typescript
observableObject.removeSubscriptions(prop: string): void;
```

**Description**:

Removes all the subcriptions from a specific property Subject.

<br>

**Arguments**:

| Key  | Type | Description |
|------|:----:|-------------|
| prop |string| The key-path to identify the property, or object, to which Subscriptions have to be removed |

<br>
<br>
<br>

___
### Credits ⭐
___
This small package is a fork of a package, created by me, while working at [IdeaSolutions S.r.l.](http://www.ideasolutions.it/), an Italian company based in Naples, Italy. A great company to work for.

<br>
<br>

___

Made with ❤ in Italy.
Every contribution is welcome.
