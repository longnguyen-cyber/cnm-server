pipeline {
    agent any
    stages {
        stage('Hello') {
            steps {
                sh "whoami"
            }
        }
        stage('l') {
            steps {
                sh "pwd"
            }
        }
        stage('Build') {
            steps {
                sh 'echo "Hello, World! This is a Jenkins pipeline with a declarative syntax."'
            }
        }
        stage('Deploy') {
            steps {
                sh 'echo "Deploying..."'
            }
        }

    }
}
