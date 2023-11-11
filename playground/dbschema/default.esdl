module default {
  type BlogPost {
    required property title -> str;
    property description -> str;
    required property content -> str {
      default := ""
    };
  }
}
