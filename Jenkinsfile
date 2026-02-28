pipeline {
    agent any

    tools {
        jdk 'jdk'
    }

    environment {
        // SonarQube
        SONAR_SERVER = 'sonar-server'
        SONAR_TOKEN  = credentials('sonar-token')

        // Docker
        DOCKERHUB_CRED = credentials('docker')
        IMAGE_NAME = "mydocker3692/swiggy-clone"
        IMAGE_TAG  = "${env.BUILD_ID}"

        // Trivy
        TRIVY_REPORT = "trivy_report.txt"
    }

    stages {

        // ===============================
        // CHECKOUT
        // ===============================
        stage('Checkout') {
            steps {
                git url: 'https://github.com/yesk993-ops/swiggy-clone.git', branch: 'main'
            }
        }

        // ===============================
        // SONARQUBE ANALYSIS
        // ===============================
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv("${SONAR_SERVER}") {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=swiggy_clone \
                            -Dsonar.sources=. \
                            -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        // ===============================
        // DOCKER BUILD
        // ===============================
        stage('Docker Build') {
            steps {
                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
             }
        }

        // ===============================
        // TRIVY SCAN
        // ===============================
        stage('Trivy Scan') {
            steps {
                sh """
                    trivy image --severity HIGH,CRITICAL ${IMAGE_NAME}:${IMAGE_TAG} > ${TRIVY_REPORT} || true
                    cat ${TRIVY_REPORT}
                """
            }
        }

        // ===============================
        // PUSH IMAGE
        // ===============================
        stage('Push Image') {
            steps {
                sh """
                    echo "${DOCKERHUB_CRED_PSW}" | docker login -u "${DOCKERHUB_CRED_USR}" --password-stdin
                    docker push ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        // ===============================
        // DEPLOY BLUE
        // ===============================
        stage('Deploy Blue') {
            steps {
                dir('k8s') {

                    sh """
                        sed -i 's|IMAGE_TAG|${IMAGE_TAG}|g' blue-deployment.yaml
                    """

                    sh "kubectl apply -f blue-deployment.yaml"
                    sh "kubectl apply -f service.yaml"

                    sh "kubectl rollout status deployment/swiggy-blue --timeout=180s"
                    sh "kubectl get pods -l version=blue"
                }
            }
        }

        stage('Verify Blue Service') {
            steps {
                sh """
                    kubectl get svc swiggy-service
                    kubectl get endpoints swiggy-service
                """
            }
        }

        // ===============================
        // WAIT BEFORE GREEN
        // ===============================
        stage('Wait 60 Seconds') {
            steps {
                sleep(time: 60, unit: 'SECONDS')
            }
        }

        // ===============================
        // DEPLOY GREEN
        // ===============================
        stage('Deploy Green') {
            steps {
                dir('k8s') {

                    sh """
                        sed -i 's|IMAGE_TAG|${IMAGE_TAG}|g' green-deployment.yaml
                    """

                    sh "kubectl apply -f green-deployment.yaml"
                    sh "kubectl rollout status deployment/swiggy-green --timeout=180s"
                    sh "kubectl get pods -l version=green"
                }
            }
        }

        stage('Verify Green Pods') {
            steps {
                sh "kubectl get pods -l version=green"
            }
        }

        // ===============================
        // SWITCH TRAFFIC
        // ===============================
        stage('Switch Traffic To Green') {
            steps {
                sh """
                    kubectl patch service swiggy-service \
                    -p '{"spec":{"selector":{"app":"swiggy","version":"green"}}}'
                """
            }
        }

        stage('Verify Green Service') {
            steps {
                sh """
                    kubectl get svc swiggy-service
                    kubectl get endpoints swiggy-service
                """
            }
        }

        stage('Scale Down Blue') {
            steps {
                sh "kubectl scale deployment swiggy-blue --replicas=0 || true"
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: "${TRIVY_REPORT}", allowEmptyArchive: true
        }
        success {
            echo "Blue-Green Deployment Completed Successfully!"
        }
        failure {
            echo "Pipeline Failed!"
        }
    }
}
