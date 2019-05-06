# Roxe

This is a lightweight utility created to observe changes to complex objects structures. This is mainly designed for event-driven applications, usually with multiple files, that need to execute some side-effects when a common central object changes its status.

It uses the powerfulness of RxJS and ES Proxies to let developers subscribe to changes to every property, also nested ones and arrays, in the observed object.

___


### Install

```sh
$ npm install --save roxe
```

<br>
<hr>

### Usage example


In this usage example, I'm supposing you are using Typescript to show you the real advantage of this package.

Instantiate a new class for every external object (not nested ones) you want to observe and pass the descriptive _typescript interface_ to `ObservableObject`'s generic parameter. This will let you, to access to object's properties, like
`nestedObjects.firstProperty`, without ignoring the errors.

Observe a specific chain-object (a dotted-separated string, as below) and then... subscribe!!! 🎉🎉🎉💁‍♂️

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

<br>

**Arguments**:

| Key  | Type | Description |
|------|:----:|-------------|
| path |string| The key-path to identify the property, or object, to snap. |

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
### Testing

Some tests based on Jasmine, are available to be executed to show how this package works.

```sh
$ npm install -D
$ npm test
```

___
### Caveats

This project compiles to a `CommonJS` module as the original project this comes from (see below), used Webpack, which does not digest `UMD` modules (using some loaders was breaking the debugging process for some reasons). If you'll need to get the UMD version, I have prepared an npm script to achieve this. Follow the script below:

```sh
# !! change to the folder you want to clone into, first !!
git clone https://github.com/alexandercerutti/roxe.git;
cd roxe;
npm run build:umd;
```

This will output a new `umd/` folder with the generated files. To conclude the process, copy the whole content of `umd/` to a new `roxe` folder in your project. I suggest you to create a link and/or commit this package on your repo to avoid losing it.

___
### Credits ⭐

This small package is a fork of a package, created by me, while working at [IdeaSolutions S.r.l.](http://www.ideasolutions.it/), an Italian company based in Naples, Italy. A great company to work for.

<br>
<br>

___

Made with ❤ in Italy.
Every contribution is welcome.
