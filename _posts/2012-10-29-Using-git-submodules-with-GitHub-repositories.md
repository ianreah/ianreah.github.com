---
layout: post
title: Using git submodules with GitHub repositories
date: 2012-10-30 10:33:00
---

I've been pretty lazy with git so far, and only used it through the [GitHub for Windows](http://windows.github.com/) GUI. But, I wanted to use [submodules](http://www.kernel.org/pub/software/scm/git/docs/user-manual.html#submodules) in a couple of my repositories and GitHub for Windows doesn't support that ([yet?](http://haacked.com/archive/2012/05/21/introducing-github-for-windows.aspx#87318)) so it seems it was time I got my hands dirty...

#### So, what are git submodules?

With git submodules a repository can contain a checkout of another repository as a subdirectory. (The containing repository is often referred to as the "superproject".)

The superproject stores the submodule repository location and a commit ID.  This means you can, for example, keep some common code in a separate repository and use a specific, known-working version of this code in other projects.

If the repository containing the common code gets an update, any superprojects using it as a submodule will not get updated until you specifically pull the changes into them. Also, you can make changes to the common code from within a superproject and push those changes to the submodule's repository to make them available to other projects. I'll go through how to deal with these cases later in the post, but first...

#### Creating a submodule

Suppose `submodule-test` is a GitHub repository containing the common code and `superproject-test` is another GitHub repository that needs to use that common code as a submodule.

To add the submodule to the superproject use the `git submodule add` command, specifying the remote url of the submodule repository and the subdirectory where the submodule files will be added.

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">git submodule add https://github.com/ianreah/submodule-test.git common-code</span>
</br>Cloning into 'common-code'...
remote: Counting objects: 6, done.
remote: Compressing objects: 100% (4/4), done.
remote: Total 6 (delta 0), reused 3 (delta 0)
Unpacking objects: 100% (6/6), done.
</code></pre>
</div>

> **Note:** It's a common scenario for the submodule code to have previously existed within the superproject before it was pulled out to be shared between projects. In this situation you may get an error like `common-code already exists in the index`. To fix this, first execute `git rm -r common-code` (obviously where `common-code` is the name of the subdirectory where you want to add the submodule files) and then try the `git submodule add` command again.

If you look at the files in the superproject now you should see the subdirectory containing the submodule repository... 

<p style="text-align: center"><img src="/images/post-2012-10-27-submodule-directory.png" alt="submodule directory structure"/></p>

Notice also the new file `.gitmodules`. This is a configuration file that stores the mapping between the submodule's remote repository url and the local subdirectory you’ve pulled it into...

<pre>
[submodule "common-code"]
	path = common-code
	url = https://github.com/ianreah/submodule-test.git
</pre>

Now commit & push the changes.

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">git commit -m "Added common-code as a submodule"</span>
</br>[master 67225a2] Added common-code as a submodule
 2 files changed, 4 insertions(+)
 create mode 100644 .gitmodules
 create mode 160000 common-code
</br><span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">git push</span>
</br>Counting objects: 4, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 447 bytes, done.
Total 3 (delta 0), reused 0 (delta 0)
To https://github.com/ianreah/superproject-test.git
   850ec91..67225a2  master -> master
</code></pre>
</div>

If you look at the superproject repository in GitHub you'll see that it doesn't actually know about any of the files in the submodule.  Instead it just contains a link to a specific commit of the submodule code.

![submodule link in a github repository](/images/post-2012-10-27-submodule-link.png)

#### Pulling submodule updates into the superproject

It's a great advantage of submodules that the submodule code within a superproject is tied to a specific commit, but at some point you're going to want to pull in any changes to the submodule code so you get the latest & greatest version in your superproject.

To do this just move into your submodule subdirectory and pull...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">cd common-code</span>

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test/common-code (master)</span>
$ <span class="cmd">git pull origin master</span><br/>
remote: Counting objects: 5, done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 3 (delta 0), reused 3 (delta 0)
Unpacking objects: 100% (3/3), done.
From https://github.com/ianreah/submodule-test
 * branch            master     -> FETCH_HEAD
Updating 61885e4..b0d106a
Fast-forward
 common code | 3 ++-
 1 file changed, 2 insertions(+), 1 deletion(-)
</code></pre>
</div>

Notice that the superproject repository recognises the modification but it is not yet 'staged for commit'...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test/common-code (master)</span>
$ <span class="cmd">cd ..</span>

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">git status</span><br/>
# On branch master
# Changes not staged for commit:
#   (use &quot;git add &lt;file&gt;...&quot; to update what will be committed)
#   (use &quot;git checkout -- &lt;file&gt;...&quot; to discard changes in working directory)
#
#       modified:   common-code (new commits)
#
no changes added to commit (use "git add" and/or "git commit -a")
</code></pre>
</div>

To add the change to the staging area and commit it at the same time, use the `-a` parameter with the `git commit` command...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">git commit -am "Pulling latest into submodule"</span>
[master 290cb32] Pulling latest into submodule
 1 file changed, 1 insertion(+), 1 deletion(-)

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">git push</span>
Counting objects: 3, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (2/2), done.
Writing objects: 100% (2/2), 257 bytes, done.
Total 2 (delta 1), reused 0 (delta 0)
To https://github.com/ianreah/superproject-test.git
   67225a2..290cb32  master -> master
</code></pre>
</div>

And, once the changes have been pushed you will see that the GitHub superproject repository now links to the updated version of the submodule...

![submodule updated in the github repository](/images/post-2012-10-27-submodule-updated.png)

#### Updating the submodule code from within the superproject

If you make some changes to the common code while working in the superproject you should commit and push the changes from the submodule subdirectory first, (remembering the `-a` parameter with the commit command)...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">cd common-code</span>

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test/common-code (master)</span>
$ <span class="cmd">git commit -am "Updating submodule from within superproject"</span><br/>
[master b4bf0d7] Updating submodule from within superproject
 1 file changed, 2 insertions(+), 1 deletion(-)

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test/common-code (master)</span>
$ <span class="cmd">git push</span><br/>
Counting objects: 5, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 361 bytes, done.
Total 3 (delta 0), reused 0 (delta 0)
To https://github.com/ianreah/submodule-test.git
   b0d106a..b4bf0d7  master -> master
</code></pre>
</div>

And then move back up to the superproject main directory and commit the change to update the submodule link in the superproject...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test/common-code (master)</span>
$ <span class="cmd">cd ..</span>

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">git commit -am "Updating submodule"</span><br/>
[master f853528] Updating submodule
 1 file changed, 1 insertion(+), 1 deletion(-)

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-test (master)</span>
$ <span class="cmd">git push</span><br/>
Counting objects: 3, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (2/2), done.
Writing objects: 100% (2/2), 249 bytes, done.
Total 2 (delta 1), reused 0 (delta 0)
To https://github.com/ianreah/superproject-test.git
   290cb32..f853528  master -> master
</code></pre>
</div>

#### Working with cloned repositories containing submodules

If you're working with GitHub for Windows then you don't need to do anything special when cloning a repository that contains submodules.  Using the "Clone in Windows" button will pull down the superproject files and the appropriate versions of the submodule files in one go.

However, if you clone the repository with the `git clone` command you'll notice that the submodule directory will be there but it will be empty.  To pull down the submodule files you need the following two commands after cloning the repository...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-clone (master)</span>
$ <span class="cmd">git submodule init</span><br/>
Submodule 'common-code' (https://github.com/ianreah/submodule-test.git) registered
for path 'common-code'

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-clone (master)</span>
$ <span class="cmd">git submodule update</span><br/>
Cloning into 'common-code'...
remote: Counting objects: 12, done.
remote: Compressing objects: 100% (10/10), done.
remote: Total 12 (delta 1), reused 8 (delta 0)
Unpacking objects: 100% (12/12), done.
Submodule path 'common-code': checked out 'b4bf0d799697a111c79d4b2420d74784240bd570'
</code></pre>
</div>

One important thing to be aware of is that when you clone a repository containing a submodule you'll find that, within the submodule, you are not working on a branch. Or, in git speak, because it has checked out a specific commit of the submodule code, which may not necessarily be a branch tip, you have a [detached head](http://www.kernel.org/pub/software/scm/git/docs/user-manual.html#detached-head)!

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-clone (master)</span>
$ <span class="cmd">cd common-code</span><br/>

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-clone/common-code ((b4bf0d7...))</span>
$ <span class="cmd">git branch</span><br/>
* (no branch)
  master
</code></pre>
</div>

This means that if you want to make any changes to the submodule code from within the superproject (as described earlier) you need to either switch to an existing branch...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-clone/common-code ((b4bf0d7...))</span>
$ <span class="cmd">git checkout master</span><br/>
Switched to branch 'master'

<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-clone/common-code (master)</span>
$ <span class="cmd">git branch</span><br/>
* master
</code></pre>
</div>

Or, create a new branch...

<div class="highlight">
<pre class="bash">
<code class="bash">
<span class="usr">Ian Reah@IANREAH-PC</span> <span class="pth">~/Dropbox/GitHub/superproject-clone/common-code ((b4bf0d7...))</span>
$ <span class="cmd">git checkout -b new-branch</span><br/>
Switched to a new branch 'new-branch'
</code></pre>
</div>

#### And finally...

If you're going to be working with submodules a lot, be sure to read up on the [pitfalls](http://www.kernel.org/pub/software/scm/git/docs/user-manual.html#_pitfalls_with_submodules)! Also, there are details of some of the more finer points of working with submodules in the [user's manual](http://www.kernel.org/pub/software/scm/git/docs/user-manual.html#submodules) and in the [Pro Git book](http://git-scm.com/book/en/Git-Tools-Submodules).