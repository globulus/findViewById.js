# findViewById.js
A Node script that goes through Android XML layout files and extracts appropriate findViewById bindings.

For some reason, Android Studio has no support for automatically migrating away from Kotlin synthetic, either to ViewBinding or to use `findViewById`. This script helps out with the laborous transitioning to `findViewById` by:
1. Parsing all the layout files in the directory you provide in order to identify views with a defined `andriod:id` and their class name.
1. Generating field declarations and a method that binds those fields using `findViewById`.

It can output either **Java** or **Kotlin** code. To chose the language, pass `-java` or `-kt` as the final argument to the script (default is `-kt`).

Sample usage:
1. Download the repo. 
1. Make sure you have [ts-node](https://www.npmjs.com/package/ts-node) installed.
1. `npm i`
1. `cd src`
1. `chmod 777 index.ts`
1. `./index.ts /Users/user/Documents/GitHub/project/res/layout /Users/user/Documents/GitHub/project/layout_output -kt`

Sample layout file:
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
              android:orientation="vertical"
              android:padding="?dialogPreferredPadding"
              android:layout_width="match_parent"
              android:layout_height="match_parent">

    <TextView
        android:text="@string/activation_code_step_1"
        android:textSize="16sp"
        android:textColor="#545454"
        android:layout_marginBottom="@dimen/_10sdp"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"/>

    <TextView
        android:id="@+id/text_with_number"
        android:textSize="16sp"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"/>

</LinearLayout>
```

Kotlin output:
```kotlin
private lateinit var text_with_number: TextView

private fun bindView(view: View) {
  text_with_number = view.findViewById(R.id.text_with_number)
}
```

Java output:
```java
private TextView text_with_number;

private void bindView(View view) {
  text_with_number = view.findViewById(R.id.text_with_number);
}
```