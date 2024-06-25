## Kariko Lin @ChlorideP
... is an amateur ~~coder man~~ scriptor, with no success to show.  
事业余臭写 ~~代码~~ 脚本的菜鸡，至今没什么拿得出手的作品。

`Kariko Lin`, a partial transliteration of my real name, and the ID `ChlorideP` are both in used, as my online nickname.  
Kariko Lin 是我一部分真名的音译转写，与 ChlorideP 这个 ID 一样，都是我目前在用的网络昵称。

> Kariko 即「雁子」。当然我真名并不是这个「雁」咯。  
> 至于`ChlorideP`里的`P`或者说`Pussemi`，则是取自 [Pusheen 漫画：Celebkitties](https://pusheen.com/1033-2/)。

```python
# introduction.py
from re import compile as regex

chloridep = {
  'name': 'ChlorideP',
  'fullname': 'Kariko Lin',  # 'Chloride Pussemi',
  # The following nickname(s) is/are just for compatibility, and won't use anymore.
  'aka': regex(r'[Cc]a(co)+'),  # Caco, cacoco, ...
  'i_can': [
    # 'PECMD', 'CMD Batch', 
    'Python', 'C', 'C++', 'C#', 'PowerShell',
    'MarkDown', 'JavaScript', 'HTML'],
  'good_at': [],
  'hobby': "discover interests, and try to learn more about them",
}
```
